"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobStream = exports.GenericStream = void 0;
const uuid_1 = require("uuid");
class GenericStream {
    constructor(redis, topic) {
        this.redis = redis;
        this.topic = topic;
    }
    queue(...obj) {
        return new Promise((acc, rej) => {
            this.redis.RPUSH(this.topic, ...obj, (err, value) => {
                if (err)
                    rej(err);
                else
                    acc(value);
            });
        });
    }
    next() {
        return new Promise((acc, rej) => {
            this.redis.BLPOP(this.topic, 0, (err, value) => {
                if (err)
                    rej(err);
                else
                    acc(value);
            });
        });
    }
}
exports.GenericStream = GenericStream;
class JobStream extends GenericStream {
    handleJob(jobHandler) {
        this.redis.BLPOP(this.topic + "_jobs", 0, (err, raw_value) => __awaiter(this, void 0, void 0, function* () {
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
                v = yield v;
            }
            // Publish our completed job results
            this.redis.PUBLISH(this.topic + "_job_" + job_id, v);
        }));
    }
    queueJob(payload) {
        let job_id = uuid_1.v4().replace('-', '');
        return {
            job_id,
            job: new Promise((acc, rej) => {
                this.redis.RPUSH(this.topic + "_jobs", job_id + ";" + payload, (err, value) => {
                    const job_channel = this.topic + "_job_" + job_id;
                    this.redis.SUBSCRIBE(job_channel);
                    this.redis.on("message", function (channel, message) {
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
exports.JobStream = JobStream;
//# sourceMappingURL=index.js.map