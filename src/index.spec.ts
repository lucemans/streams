import { GenericStream, JobStream } from ".";
import redis, { RedisClient } from 'redis-mock';

describe('Generic Stream', () => {

    let client: RedisClient;

    beforeEach(() => {
        client = redis.createClient();
    });
    
    afterEach(() => {
        client.quit();
    });

    test('Basic Stream', () => {
        const stream = new GenericStream(client, 'test0');
        expect(stream.redis).toEqual(client);
        expect(stream.topic).toEqual('test0');
    });

    test('Push to Stream', async () => {
        const stream = new GenericStream(client, 'test1');
        await stream.push('hi');
    });

    test('Pop from Stream', async () => {
        const stream = new GenericStream(client, 'test2');
        await stream.push('test-string');
        const res = await stream.pop();
        expect(res.stream).toEqual('test2');
        expect(res.value).toEqual('test-string');
    });

    test('Clear Stream', async () => {
        const stream = new GenericStream(client, 'test3');
        await stream.push('1');
        await stream.push('2');
        await stream.clear();
        await stream.push('3');
        const res = await stream.pop();
        expect(res.stream).toEqual('test3');
        expect(res.value).toEqual('3');
    });

});

describe('Job Stream', () => {
    const client = redis.createClient();

    test('Basic Stream', () => {
        const stream = new JobStream(client, 'test0');
        expect(stream.redis).toEqual(client);
        expect(stream.topic).toEqual('test0');
    });

    test('Push to Stream', async () => {
        const stream = new JobStream(client, 'test1');
        const job = await stream.push('payload');
        expect(job.nonce).toHaveLength(32);
        expect(job.value).toBeInstanceOf(Promise);
    });

    test('Pop from Stream', async () => {
        const stream = new JobStream(client, 'test2');
        const job = await stream.push('payload');
        const job2 = await stream.pop();
        expect(job2.nonce).toEqual(job.nonce);
        expect(job2.value).toEqual('payload');
    });

    test('Reply to Stream', async () => {
        const stream = new JobStream(client, 'test2');
        const job = await stream.push('payload');
        const job2 = await stream.pop();
        await stream.reply(job2.nonce, 'world');
        expect(await job.value).toEqual('world');
    });

});