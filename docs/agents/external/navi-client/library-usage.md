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

You can also point the client directly at the same YAML/JSON config files a self-hosted Navi engine reads, instead of building the payload by hand:

```js
// One POST /api/config call per distinct namespace found across the files
await client.configFromFiles(['./config/reports.yml', './config/billing.json']);

// Force JSON or YAML parsing regardless of file extension
await client.configFromJson(['./config/reports.cfg']);
await client.configFromYaml(['./config/reports.cfg']);
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
| `configFromJson(paths)` | `POST /api/config` (once per namespace) — reads one or more files, forcing JSON parsing. |
| `configFromYaml(paths)` | `POST /api/config` (once per namespace) — reads one or more files, forcing YAML parsing. |
| `configFromFiles(paths)` | `POST /api/config` (once per namespace) — reads one or more files, auto-detecting JSON vs. YAML from each path's extension (`.json` vs. `.yml`/`.yaml`). |
| `engineStart(payload = {})` | `POST /api/engine/start` |
| `engineStop()` | `POST /api/engine/stop` |

`configFromJson`/`configFromYaml`/`configFromFiles` each accept a single path or an array of paths. Every given file is read and parsed up front — no `include:` chain is followed, only the `namespace`/`resources`/`clients` keys are extracted from each file — and the call throws before sending any request if any file is missing or fails to parse. Files are grouped by `namespace` (defaulting to `'default'` when omitted) in order of first appearance across the given paths, with same-namespace collisions resolved last-file-wins; one `POST /api/config` request is then issued **sequentially** per namespace group, and the call resolves to an array of per-namespace results, in that same order. `${VAR}`/`$VAR` env references found in the file content are resolved locally, against the client process's own environment, before anything is sent.

Every method returns a `Promise` resolving to the parsed JSON response body — or, for the `configFrom*` methods, an array of response bodies, one per namespace — and rejects with an `ApiRequestFailed` error (`statusCode`, `url`, `body`) when a request fails or the response status is `>= 400`.

See [Reference](./reference.md) for the full request/response shape of each `/api/*` route.

[← Back to How to Use navi-hey-client](../HOW_TO_USE_NAVI-CLIENT.md)
