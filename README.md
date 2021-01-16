### @lucemans
# Streams

## How to use

On the sending end

```typescript
const stream = new GenericStream(client, 'topic');
await stream.push('test-string');
```

On the receiving end

```typescript
const stream = new GenericStream(client, 'topic');
const result = await stream.pop();
console.log(result.value);
```
