import { Subject } from 'rxjs';

interface RedisInterface {
    RPUSH: any;
    BLPOP: any;
    RPUSHX: any;
}

export class StreamClient {

    redis: RedisInterface;
    streams: { [key: string]: Stream } = {};

    constructor(redis: RedisInterface) {
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
    subject: Subject<any>;
    topic: string;

    constructor(client: StreamClient, topic: string) {
        this.client = client;
        this.topic = topic;
        this.subject = new Subject();
    }

    public next(...obj: string[]) {
        this.client.redis.RPUSH(this.topic, ...obj, (err, n) => {
            if (err != null)
                throw err;
        });
    }

    ready() {
        this.client.redis.BLPOP(this.topic, 0, (err, a) => {
            this.subject.next(a[1]);
        });
    }
}