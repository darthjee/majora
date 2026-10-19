# majora-client

Node.js library and command-line client for the [Majora](https://github.com/darthjee/majora)
RPG campaign manager API, meant for automations.

> **Work in progress.** This package is being built as part of epic #1592. The core library
> (configuration, HTTP, pagination, retries and errors) is available; the resource wrappers
> (`client.game(slug)`, `client.games`) and the `majora` CLI come in later sub-issues.

## Overview

- Authenticates with **scoped API tokens** (`Authorization: Bearer mjr_...`), never with the
  legacy all-access token.
- Talks to the API over **HTTPS only**, unless insecure HTTP is explicitly allowed.
- Requires **Node.js 20 or later** (native `fetch`, `AbortSignal.any`, `util.parseArgs`).
- Has **no runtime dependencies**.

## Library usage

### Construction

```js
import { MajoraClient } from 'majora-client';

const client = new MajoraClient({
  baseUrl: 'https://majora.example.com', // falls back to MAJORA_URL
  token: 'mjr_...',                      // falls back to MAJORA_TOKEN
  timeout: 30000,                        // ms per attempt, default 30000, 0 disables
  retries: 2,                            // GET retries, default 2, 0 disables
});
```

- Configuration is validated at construction: a missing or invalid `baseUrl`, or a missing
  token, throws `ConfigurationError` before any request.
- **HTTPS only.** An `http://` URL is rejected unless the host is `localhost` / `127.0.0.1`,
  or `allowInsecureHttp: true` is passed (for example for a docker-compose service name).
- `fetch` can be injected (`new MajoraClient({ fetch })`), defaulting to `globalThis.fetch`.

Until the resource wrappers land, requests go through `client.http` and `client.paginator`.
Paths are relative to `baseUrl` and given without the `.json` suffix:

```js
const { body } = await client.http.get('games/epic-quest/npcs/12');
await client.http.patch('games/epic-quest/npcs/12', { name: 'Robert' });
```

Every request carries `Authorization: Bearer <token>`. Bodies are sent as JSON, or as
`multipart/form-data` when a native `FormData` is given.

### Pagination

```js
const page = await client.paginator.list('games/epic-quest/npcs', {
  page: 2, perPage: 50, query: { name: 'Bob' },
});
page.data;    // array of plain objects
page.page;    // 2
page.pages;   // 7
page.perPage; // 50
page.total;   // 330
page.hasNext; // true
await page.next(); // the next Page, or null on the last one

for await (const npc of client.paginator.iterate('games/epic-quest/npcs', { query: { slain: false } })) {
  // one page fetched at a time, on demand
}
```

- Filters go in `query`; they cannot override `page` / `per_page`.
- `perPage` is sent only when given; otherwise the server default applies.
- Non-paginated lists return a single `Page` (`page = pages = 1`, `total = data.length`).
- Pagination is offset-based: items created or deleted during an iteration can be skipped or
  repeated.

### Errors

Everything the library throws extends `MajoraError`:

| Class | When |
|---|---|
| `ConfigurationError` | missing or invalid `baseUrl` / token, insecure URL |
| `UsageError` | bad arguments, detected locally |
| `NetworkError` | `fetch` rejected; `cause` set, `timeout === true` on a timeout |
| `ApiError` | any non-2xx response (`status`, `method`, `path`, `body`, `codes`) |
| `ValidationError` | 400, with `fields` (`{ name: ['blank'] }`) |
| `AuthenticationError` | 401 |
| `PermissionError` | 403, with `code`: `scope_missing`, `game_not_allowed`, `token_not_allowed` or `null` |
| `NotFoundError` | 404 |
| `ServerError` | 5xx |

```js
import { PermissionError, ValidationError } from 'majora-client';

try {
  await client.http.get('games/epic-quest/npcs/all');
} catch (error) {
  if (error instanceof PermissionError && error.code === 'scope_missing') {
    // the token lacks the scope
  } else if (error instanceof ValidationError) {
    console.error(error.fields);
  } else {
    throw error;
  }
}
```

Errors never contain the token, any request header or the request body.

### Timeouts and retries

- Every attempt has a timeout (`timeout` option, overridable per call with `{ timeout }`); a
  caller `{ signal }` is combined with it.
- Only `GET` requests are retried, on network errors (not a caller abort) and on 429 (honoring
  `Retry-After`), 502, 503 and 504, with exponential backoff (about 0.5 s, then 1 s). Writes,
  500 and other 4xx are never retried. Override per call with `{ retries }`.
- `iterate` retries each page fetch on its own.

## Development

No Node.js runtime is needed on the host: everything runs in the `majora_client`
docker-compose service, from the repository root.

```bash
make client-install    # install dev dependencies (once, and after dependency changes)
make client-tests      # run the Jasmine specs
make client-lint       # run ESLint
make client-coverage   # run the specs with c8 coverage (lcov in client/coverage/)
make client            # open a shell in the majora_client container
```

## Documentation

See the [client spec](../docs/agents/specs/client.md) and its aspect pages under
`docs/agents/specs/client/`.

## License

MIT
