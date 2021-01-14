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
exports.JobStream = exports.GenericStream = exports.Stream = void 0;
const uuid_1 = require("uuid");
class Stream {
    constructor(redis, topic) {
        this.redis = redis;
        this.topic = topic;
    }
}
exports.Stream = Stream;
class GenericStream extends Stream {
    push(...obj) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((acc, rej) => {
                this.redis.RPUSH(this.topic, ...obj, (err, value) => { err ? rej(err) : acc(value); });
            });
        });
    }
    pop() {
        return __awaiter(this, void 0, void 0, function* () {
            const value = yield new Promise((acc, rej) => { this.redis.BLPOP(this.topic, 0, (a, b) => { a ? rej(a) : acc(b); }); });
            return { stream: value[0], value: value[1] };
        });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((acc, rej) => {
                this.redis.LTRIM(this.topic, 99, 0, (a, b) => { a ? rej(a) : acc(); });
            });
        });
    }
}
exports.GenericStream = GenericStream;
class JobStream extends Stream {
    pop() {
        return __awaiter(this, void 0, void 0, function* () {
            const value = yield new Promise((resolve, reject) => {
                this.redis.BLPOP(this.topic, 0, (err, value) => __awaiter(this, void 0, void 0, function* () { err ? reject(err) : resolve(value); }));
            });
            const job_id = value.split(';')[0];
            const message = value.substr(job_id.length + 1);
            return message;
        });
    }
    reply(job_id, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                this.redis.PUBLISH(this.topic + '_' + job_id, () => {
                    resolve();
                });
            });
        });
    }
    push(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            let job_id = uuid_1.v4().replace('-', '');
            yield new Promise((resolve, reject) => { this.redis.RPUSH(this.topic, job_id + ';' + payload, (err, value) => { err ? reject(err) : resolve(value); }); });
            const channel = this.topic + '_' + job_id;
            this.redis.SUBSCRIBE(channel);
            const result = new Promise((resolve) => {
                this.redis.on('message', (ch, message) => {
                    if (ch !== channel)
                        return;
                    this.redis.UNSUBSCRIBE(channel);
                    resolve(message);
                });
            });
            return {
                nonce: job_id,
                value: result
            };
        });
    }
}
exports.JobStream = JobStream;
//# sourceMappingURL=index.js.map