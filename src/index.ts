import { Subject } from 'rxjs';
import { v4 as uuid } from 'uuid';

interface RedisInterface {
    RPUSH: any;
    BLPOP: any;
    RPUSHX: any;
    SUBSCRIBE: any;
    UNSUBSCRIBE: any;
    PUBLISH: any;
    on: any;
}

export interface JobHandler {
    (input: string): (Promise<string> | string);
}

export class GenericStream {
    redis: RedisInterface;
    topic: string;

    constructor(redis: RedisInterface, topic: string) {
        this.redis = redis;
        this.topic = topic;
    }

    queue(...obj: string[]) {
        return new Promise<any>((acc, rej) => {
            this.redis.RPUSH(this.topic, ...obj, (err, value) => {
                if (err)
                    rej(err);
                else
                    acc(value);
            });
        });
    }

    next() {
        return new Promise<string>((acc, rej) => {
            this.redis.BLPOP(this.topic, 0, (err, value) => {
                if (err)
                    rej(err);
                else
                    acc(value);
            });
        });
    }
}
export class JobStream extends GenericStream {

    handleJob(jobHandler: JobHandler) {
        this.redis.BLPOP(this.topic + "_jobs", 0, async (err, raw_value: string) => {
            if (err)
                throw err;
            // Gather the JOB_ID
            let job_id = raw_value.split(';')[0];
            // Extract the payload
            let value = raw_value.replace(job_id + ';', '');
            // Execute the handler
            let v = jobHandler(value);
            // Await handling
            if (v instanceof Promise) {
                v = await v;
            }
            // Publish our completed job results
            this.redis.PUBLISH(this.topic + "_job_" + job_id, v);
        });
    }

    queueJob(payload: string): { job_id: number, job: Promise<string> } {
        let job_id = uuid().replace('-', '');
        return {
            job_id,
            job: new Promise<string>((acc, rej) => {
                this.redis.RPUSH(this.topic + "_jobs", job_id + ";" + payload, (err, value) => {
                    const job_channel = this.topic + "_job_" + job_id;
                    this.redis.SUBSCRIBE(job_channel);

                    this.redis.on("message", function(channel, message) {
                        if (channel == job_channel) {
                            this.redis.UNSUBSCRIBE(job_channel);
                            acc(message);
                        }
                      });
                });
            })
        };
    }
}