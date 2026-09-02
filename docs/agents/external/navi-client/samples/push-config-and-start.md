# Push a config and start a scoped run

From a Node script, push a hand-built configuration into a running Navi instance
and then start a warming run scoped to just that namespace.

## Scenario

A Navi instance is already running at `https://navi.internal.example.com` with a
`web.api.token` configured. From a deploy script you want to register a `reports`
namespace — one client and one `categories` resource — and immediately warm only
that resource, without touching anything else the instance is running.

## Code

```js
import { NaviClient } from 'navi-hey-client';

const client = new NaviClient({
  baseUrl: 'https://navi.internal.example.com',
  token: process.env.NAVI_API_TOKEN,
});

await client.config({
  namespace: 'reports',
  clients: { default: { base_url: 'https://example.com' } },
  resources: {
    categories: [{ url: '/categories.json', status: 200 }],
  },
});

await client.engineStart({
  targets: [{ namespace: 'reports', resources: ['categories'] }],
});
```

## What happens

The constructor stores `baseUrl` and `token`; no request is made yet.

`client.config(payload)` issues `POST https://navi.internal.example.com/api/config`
with the `Authorization: Bearer <NAVI_API_TOKEN>` header. The instance merges the
`reports` namespace's `clients` and `resources` into its running configuration.
The promise resolves to the parsed JSON response body.

Once that resolves, `client.engineStart({ targets: [...] })` issues
`POST /api/engine/start`, scoping the run to the `categories` resource in the
`reports` namespace. It also resolves to the parsed JSON body.

The two calls run sequentially because each is `await`ed. If either request fails
outright or returns status `>= 400`, that call rejects with an `ApiRequestFailed`
error (`statusCode`, `url`, `body`) and the later call never runs.

## Notes

- A hand-built payload passed to `config()` is sent literally — no `${VAR}`/`$VAR`
  resolution happens. Resolve any values before constructing it.
- `engineStart()` accepts no argument to start every configured namespace.
- Method-to-route mapping and constructor options:
  [Library Usage](../library-usage.md). Request/response shapes and error
  handling: [Reference](../reference.md).

---
[← Back to Samples](../samples.md)
