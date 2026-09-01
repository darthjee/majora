# Handle a failed API call

Catch `ApiRequestFailed` from a client call and inspect the status, URL, and
response body it carries.

## Scenario

Your deploy script calls `engineStart()` against a running Navi instance. The
instance might be down, the token might be wrong (`401`), or the engine might
already be running (`>= 400`). You want the script to log enough detail to
diagnose it, and to exit non-zero so the pipeline fails.

## Code

```js
import { NaviClient } from 'navi-hey-client';

const client = new NaviClient({
  baseUrl: 'https://navi.internal.example.com',
  token: process.env.NAVI_API_TOKEN,
});

try {
  const result = await client.engineStart();
  console.log('warming run started:', result);
} catch (err) {
  if (err.name === 'ApiRequestFailed') {
    console.error(`request to ${err.url} failed with ${err.statusCode}`);
    console.error('response body:', err.body);
    process.exit(1);
  }
  throw err;
}
```

## Command

The CLI surfaces the same failure without any code: `navi-client --action
engine-start …` prints the `ApiRequestFailed` message to stderr and exits with
status `1`, so a CI step running it fails automatically.

## What happens

`engineStart()` issues `POST /api/engine/start`. Any request that fails outright
(connection refused, timeout) or receives a response with status `>= 400`
rejects with an `ApiRequestFailed` error carrying:

| Field | Example |
|-------|---------|
| `statusCode` | `401` — the HTTP status returned, when a response was received. |
| `url` | `https://navi.internal.example.com/api/engine/start` — the full URL requested. |
| `body` | the parsed response body, when available. |

The `catch` checks `err.name === 'ApiRequestFailed'`, logs those fields, and
exits `1`. Any other error (e.g. a programming bug) is re-thrown unchanged. Every
`NaviClient` method — `config`, `configFrom*`, `engineStart`, `engineStop` —
rejects the same way, so one handler shape covers all of them.

## Notes

- Full `ApiRequestFailed` field table and the CLI's stderr/exit-`1` behaviour:
  [Reference](../reference.md).

---
[← Back to Samples](../samples.md)
