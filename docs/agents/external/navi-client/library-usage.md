# Library Usage

Import `NaviClient` and construct it with the target Navi instance's base URL and API token:

```js
import { NaviClient } from 'navi-hey-client';

const client = new NaviClient({
  baseUrl: 'http://localhost:3000',
  token: process.env.NAVI_API_TOKEN,
});

// POST /api/config
await client.config({
  namespace: 'reports',
  clients: { default: { base_url: 'https://example.com' } },
  resources: { categories: [{ url: '/categories.json', status: 200 }] },
});

// POST /api/engine/start
await client.engineStart({
  targets: [{ namespace: 'reports', resources: ['categories'] }],
});

// POST /api/engine/stop
await client.engineStop();
```

## `NaviClient`

| Constructor option | Description |
|---------------------|-------------|
| `baseUrl` | Base URL of the running Navi instance (no trailing slash required). |
| `token` | Bearer token matching the target instance's `web.api.token`. |
| `timeout` | Optional request timeout in milliseconds. Defaults to `5000`. |

| Method | Maps to |
|--------|---------|
| `config(payload)` | `POST /api/config` |
| `engineStart(payload = {})` | `POST /api/engine/start` |
| `engineStop()` | `POST /api/engine/stop` |

Every method returns a `Promise` resolving to the parsed JSON response body, and rejects with an `ApiRequestFailed` error (`statusCode`, `url`, `body`) when the request fails or the response status is `>= 400`.

See [Reference](./reference.md) for the full request/response shape of each `/api/*` route.

[← Back to How to Use navi-hey-client](../HOW_TO_USE_NAVI-CLIENT.md)
