import { ClientOpts, RedisClient, RedisError } from 'redis';
import { Observable, Subject } from 'rxjs';

export default class StreamClient {

    redis: RedisClient;
    streams: { [key: string]: Stream} = {};

    constructor(redis: RedisClient) {
        this.redis = redis;
    }

    stream(topic: string): Stream {
        if (this.stream[topic])
            return this.stream[topic];
        this.stream[topic] = new Stream(this, name);
        return this.stream(topic);
    }

}

export class Stream {
    client: StreamClient;
    readyState = false;
    subject: Subject<any>;
    topic: string;

    constructor(client: StreamClient, topic: string) {
        this.client = client;
        this.topic = topic;
        this.subject = new Subject();
    }

    async push(obj: any): Promise<void> {
        return new Promise<>((acc, rej) => {
            this.client.redis.LPUSH(this.topic, obj, (n) => {
                if (n)
                    acc();
                else
                    rej(new Error('LPUSH CODE ' + n));
            });
        });
    }

    async ready() {
        this.readyState = true;
        this.client.redis.BLPOP(this.topic, this.subject.next);
    }
}