import { v4 as uuid } from 'uuid';

interface RedisInterface {
    RPUSH: any;
    BLPOP: any;
    RPUSHX: any;
    LTRIM: any;
    subscribe: any;
    unsubscribe: any;
    publish: any;
    on: any;
}


export interface StreamReply<K> {
    stream: string;
    value: K;
}

export interface JobReply {
    nonce: string;
    value: Promise<string> | string
}

export class Stream {
    redis: RedisInterface;
    topic: string;

    constructor(redis: RedisInterface, topic: string) {
        this.redis = redis;
        this.topic = topic;
    }
}

export class GenericStream extends Stream {

    async push(...obj: string[]) {
        return new Promise<any>((acc, rej) => {
            this.redis.RPUSH(this.topic, ...obj, (err, value) => { err ? rej(err) : acc(value) });
        });
    }

    async pop(): Promise<StreamReply<string>> {
        const value = await new Promise<string[]>((acc, rej) => { this.redis.BLPOP(this.topic, 0, (a: unknown, b: string[]) => { a ? rej(a) : acc(b) }); });
        return { stream: value[0], value: value[1] };
    }

    async clear() {
        return new Promise<void>((acc, rej) => {
            this.redis.LTRIM(this.topic, 99, 0, (a: unknown, b: unknown) => { a ? rej(a) : acc() });
        });
    }
}
export class JobStream extends Stream {

    async pop(): Promise<JobReply> {
        const value = await new Promise<string>((resolve, reject) => {
            this.redis.BLPOP(this.topic, 0, async (err, value: string) => { err ? reject(err) : resolve(value) });
        });

        const job_id = value[1].split(';')[0];
        const message = value[1].substr(job_id.length + 1);

        return {nonce: job_id, value: message};
    }

    async reply(job_id: string, payload: string) {
        return new Promise<void>((resolve,) => {
            this.redis.publish(this.topic + '_' + job_id, payload, () => {
                resolve();
            });
        });
    }

    async push(payload: string): Promise<JobReply> {
        let job_id = uuid().replace(/-/g, '');

        await new Promise((resolve, reject) => { this.redis.RPUSH(this.topic, job_id + ';' + payload, (err, value) => { err ? reject(err) : resolve(value) }) });

        const channel = this.topic + '_' + job_id;

        const result = new Promise<string>((resolve,) => {
            this.redis.on('message', (ch, message) => {
                if (ch !== channel) return;
                this.redis.unsubscribe(channel);
                resolve(message);
            });
            this.redis.subscribe(channel);
        });

        return {
            nonce: job_id,
            value: result
        }
    }
}