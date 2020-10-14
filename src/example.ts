import { createClient } from "redis";
import { StreamClient, Stream } from "./index";

const redis = createClient({host: "nl-redis.lvksh.svc.cluster.local"});
redis.on('connected', () => {
    console.log('connected');
});
redis.on("ready", () => {
    console.log('ready')
    const streams = new StreamClient(redis);

    // streams.stream("auth").subject.subscribe((a) => {
    //     console.log(a);
    //     streams.stream("auth").ready();
    // });
    // streams.stream("auth").ready();

    let s = streams.stream("auth_get_account").next('a', 'b c');
    // redis.RPUSH("auth_get_account", "ABC", (err, acc) => {
    //     console.log(err, acc);
    // })
});
