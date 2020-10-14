import { Subject } from 'rxjs';

export class StreamClient {

    redis: {RPUSH: any, BLPOP: any};
    streams: { [key: string]: Stream} = {};

    constructor(redis: {RPUSH: any, BLPOP: any}) {
        this.redis = redis;
    }

    stream(topic: string): Stream {
        if (this.stream[topic])
            return this.stream[topic];
        this.stream[topic] = new Stream(this, topic);
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
        return new Promise<void>((acc, rej) => {
            this.client.redis.RPUSH(this.topic, obj, (n) => {
                if (n)
                    acc();
                else
                    rej(new Error('LPUSH CODE ' + n));
            });
        });
    }

    async ready() {
        this.readyState = true;
        this.client.redis.BLPOP(this.topic, 0, (err, a) => {
            this.subject.next(a[1]);
        });
    }
}