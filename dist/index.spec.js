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
const _1 = require(".");
const redis = require('redis-mock');
describe('Generic Stream', () => {
    const client = redis.createClient();
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
    const client = redis.createClient();
    test('Basic Stream', () => {
        const stream = new _1.JobStream(client, 'test0');
        expect(stream.redis).toEqual(client);
        expect(stream.topic).toEqual('test0');
    });
    test('Push to Stream', () => {
        const stream = new _1.JobStream(client, 'test1');
        stream.push('payload');
    });
});
//# sourceMappingURL=index.spec.js.map