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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const redis_mock_1 = __importDefault(require("redis-mock"));
describe('Generic Stream', () => {
    let client;
    beforeEach(() => {
        client = redis_mock_1.default.createClient();
    });
    afterEach(() => {
        client.quit();
    });
    test('Basic Stream', () => {
        const stream = new _1.GenericStream(client, 'test0');
        expect(stream.redis).toEqual(client);
        expect(stream.topic).toEqual('test0');
    });
    test('Push to Stream', () => __awaiter(void 0, void 0, void 0, function* () {
        const stream = new _1.GenericStream(client, 'test1');
        yield stream.push('hi');
    }));
    test('Pop from Stream', () => __awaiter(void 0, void 0, void 0, function* () {
        const stream = new _1.GenericStream(client, 'test2');
        yield stream.push('test-string');
        const res = yield stream.pop();
        expect(res.stream).toEqual('test2');
        expect(res.value).toEqual('test-string');
    }));
    test('Clear Stream', () => __awaiter(void 0, void 0, void 0, function* () {
        const stream = new _1.GenericStream(client, 'test3');
        yield stream.push('1');
        yield stream.push('2');
        yield stream.clear();
        yield stream.push('3');
        const res = yield stream.pop();
        expect(res.stream).toEqual('test3');
        expect(res.value).toEqual('3');
    }));
});
describe('Job Stream', () => {
    const client = redis_mock_1.default.createClient();
    test('Basic Stream', () => {
        const stream = new _1.JobStream(client, 'test0');
        expect(stream.redis).toEqual(client);
        expect(stream.topic).toEqual('test0');
    });
    test('Push to Stream', () => __awaiter(void 0, void 0, void 0, function* () {
        const stream = new _1.JobStream(client, 'test1');
        const job = yield stream.push('payload');
        expect(job.nonce).toHaveLength(32);
        expect(job.value).toBeInstanceOf(Promise);
    }));
    test('Pop from Stream', () => __awaiter(void 0, void 0, void 0, function* () {
        const stream = new _1.JobStream(client, 'test2');
        const job = yield stream.push('payload');
        const job2 = yield stream.pop();
        expect(job2.nonce).toEqual(job.nonce);
        expect(job2.value).toEqual('payload');
    }));
    test('Reply to Stream', () => __awaiter(void 0, void 0, void 0, function* () {
        const stream = new _1.JobStream(client, 'test2');
        const job = yield stream.push('payload');
        const job2 = yield stream.pop();
        yield stream.reply(job2.nonce, 'world');
        expect(yield job.value).toEqual('world');
    }));
});
//# sourceMappingURL=index.spec.js.map