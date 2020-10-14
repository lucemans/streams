import { createClient } from "redis";
import { StreamClient } from ".";

const redis = createClient({host: "nl-redis.lvksh.svc.cluster.local"});
redis.on('connected', () => {
    console.log('connected');
});
redis.on("ready", () => {
    console.log('ready')
});
const streams = new StreamClient(redis);

streams.stream("auth").subject.subscribe((a) => {
    console.log(a);
    streams.stream("auth").ready();
});
streams.stream("auth").ready();