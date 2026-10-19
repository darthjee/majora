# Client Library

Design and internals of the Node.js library in `client/`: the core that automations import and
the resource wrappers built on it. The npm-facing usage reference is
[`client/README.md`](../../../client/README.md); this page explains how it is built and why.

## Language and runtime

- Plain JavaScript with ES modules and JSDoc types. No build step and no TypeScript.
- Node 20 or later (`engines.node >= 20`): it relies on native `fetch`, `AbortSignal.timeout`,
  `AbortSignal.any` and `FormData`.
- **No runtime dependencies.** Only dev dependencies (Jasmine, c8, ESLint) are allowed.

## Configuration and transport security

- The entry point is
  `new MajoraClient({ baseUrl, token, timeout, retries, fetch, allowInsecureHttp, env })`.
  `env` defaults to `process.env` and exists for tests and for the CLI, which injects its own.
- A blank (`undefined`, `null` or `''`) `baseUrl` or `token` falls back to `MAJORA_URL` /
  `MAJORA_TOKEN` from `env`.
- `core/Config.js` validates everything when the client is built, before any request, and
  throws `ConfigurationError` on failure:
  - `baseUrl` is required, must be an absolute `http:`/`https:` URL with no credentials, query
    or fragment; trailing slashes are stripped;
  - `token` is required and must be a string;
  - `timeout` and `retries` must be non-negative integers; `fetch` must be a function.
- The resulting `Config` is frozen, and its `token` is non-enumerable, so it does not show up
  when the object is logged or serialized.
- **HTTPS only.** An `http:` `baseUrl` throws `ConfigurationError` unless the host is
  `localhost` / `127.0.0.1` or `allowInsecureHttp: true` is passed (needed for docker-compose
  hostnames such as `http://majora_proxy`). The Bearer token must never travel in clear text by
  accident; the opt-in has to be explicit.

## Module layout

```text
client/
  package.json            # "type": "module", "main"/"exports": src/index.js, "bin": { "majora": "bin/majora.js" }
  bin/majora.js           # CLI shim (see cli.md)
  src/
    index.js              # public exports: MajoraClient and the 10 error classes
    MajoraClient.js       # resolves Config, builds HttpClient and Paginator, exposes the wrappers
    core/
      Config.js           # options, env fallback, validation
      HttpClient.js       # fetch, Bearer header, .json URLs, bodies, error mapping, retries
      RetryPolicy.js      # which requests are retried and the backoff
      requestHelpers.js   # jsonPath, appendQuery, encodeBody, parseBody, attemptSignal
      Page.js             # one page of results and its pagination headers
      Paginator.js        # list and iterate over paginated endpoints
      errors/             # one class per file, plus buildApiError.js and extractCodes.js
    resources/            # Resource, GameResource, CharacterResource and one file per family
    cli/                  # the CLI (see cli.md)
  specs/                  # Jasmine specs mirroring src/, plus specs/support/
```

- **One class per file, PascalCase**, like the frontend.
- **`src/index.js` is the only public entry point** (`exports` points at it), so `core/`
  internals can change without a breaking release. `MajoraClient` also exposes `client.http`
  (the `HttpClient`) and `client.paginator` as getters, documented in the README as the raw
  request escape hatch.
- **Resource files are named after scope families** (`Npcs.js`, `Pcs.js`, not
  `Characters.js`), so each wrapper maps onto the scope it needs (see
  [Token scopes](../access-control/token-scopes.md)).

## HTTP core

- Every request carries `Authorization: Bearer <token>`; it always overrides any caller header.
  `Accept: application/json` is sent by default.
- `HttpClient.request(method, path, { query, body, headers, timeout, retries, signal })` (plus
  `get`, `post`, `patch`, `delete`) takes paths without `.json` and calls
  `<baseUrl>/<path>.json`. Query values that are `undefined` or `null` are skipped; arrays repeat
  the key.
- Bodies are JSON (`Content-Type: application/json`) or a native `FormData`, passed as is.
- Responses are parsed as JSON, or kept as raw text when they are not JSON (so an HTML 502 never
  breaks parsing); an empty body gives `null`.
- Every non-2xx response becomes a typed error (see [Errors](#errors)).

## Pagination

Follows [`pagination.md`](../pagination.md): `page` / `per_page` query parameters, and `page` /
`pages` / `per_page` / `total` response headers.

- `list(options)` returns a `Page`: `data`, `page`, `pages`, `perPage`, `total`, a `hasNext`
  getter and `next()` (the next `Page`, or `null`).
- `iterate(options)` is an async generator over **items**, fetching one page at a time and
  stopping when there is no next page or a page is empty. Each page fetch is retried on its own.
- Filters go in a separate `query` object, so they cannot collide with the library's own
  options (`page`, `perPage`, `restricted`).
- No client-side default page size: `per_page` is only sent when `perPage` is given, otherwise
  the server default applies.
- A response with no pagination headers still gives a `Page` (`page = pages = 1`,
  `total = data.length`). A non-array body gives `data = []`.
- Pagination is offset-based, so items created or deleted during an iteration can be skipped or
  repeated. This is documented, not worked around.

## Errors

Every error extends `MajoraError` and is exported from `src/index.js`:

```text
MajoraError
├── ConfigurationError           bad options, missing/insecure baseUrl, missing token
├── UsageError                   local misuse: missing id or slug, unsupported action or variant
├── NetworkError                 fetch rejected, timeout or abort; `cause`, `timeout` (boolean)
└── ApiError                     any non-2xx: `status`, `method`, `path`, `body`, `codes`
    ├── ValidationError     400  `fields` (the `errors` object, or {})
    ├── AuthenticationError 401
    ├── PermissionError     403  `code`: scope_missing | game_not_allowed | token_not_allowed | null
    ├── NotFoundError       404
    └── ServerError         5xx
```

- Statuses without a subclass (409, 422, ...) raise a plain `ApiError`.
- `codes` (`core/errors/extractCodes.js`) is a de-duplicated list of the string codes found in
  `errors.<field>`, `detail`, `error` and `reason`. It covers the API's 400 bodies, the 403
  scope bodies (`{"errors": {"detail": ["<code>"]}}`, see
  [Token scopes](../access-control/token-scopes.md#error-responses)) and the proxy's upload and
  link 422 bodies.
- `PermissionError.code` is the first scope code found in `codes`, or `null` for a role denial.
- Messages are `<status> <ClassName> on <METHOD> <path>` plus `: <codes>`, for example
  `403 PermissionError on GET /games/x/npcs/all.json: scope_missing`.
- **Errors never carry the token**, any request header or the request body (which may hold
  private campaign content).
- `instanceof` is the contract: callers branch on the subclass, then on `code`.

## Retries and timeouts

The endpoints a scoped token can reach have no throttling, so the real failure modes are
network errors, proxy 502/503/504 during a deploy, and a slow backend.

- **Timeouts** are on by default: 30 s (`timeout`, per client or per call; `0` disables). Each
  attempt gets a fresh `AbortSignal.timeout`, combined with a caller `signal` through
  `AbortSignal.any`. A timeout throws `NetworkError` with `timeout === true`; a caller abort
  throws `NetworkError` ("Request aborted on ...") and is never retried.
- **Retries** (`core/RetryPolicy.js`) apply to `GET` only. `POST` and `PATCH` are never retried,
  since a retry after a lost response could duplicate content or repeat a non-idempotent change.
- A `GET` is retried on a `NetworkError` (except a caller abort) and on 429, 502, 503 and 504.
  Never on other 4xx or on 500, which are deterministic.
- Defaults: `retries: 2` (per client or per call; `0` disables), exponential backoff with
  jitter, about 0.5 s then 1 s. A `Retry-After` header (seconds or HTTP date) overrides the
  delay.

## Resource wrappers

The core is generic; wrappers sit on top, one per scope family. A wrapper never checks scopes
itself: the API does.

### Accessors

```js
await client.games.list();            // games.json, a Page
await client.games.mine();            // my-games.json, the plain array
await client.games.get('epic-quest');  // games/epic-quest.json

const game = client.game('epic-quest');
await game.npcs.list({ page: 2 });
await game.npcs.get(12, { restricted: true });
await game.npcs.create({ name: 'Bob' });
await game.npcs.update(12, { name: 'Robert' });
```

- `client.games` is top-level and read-only (`list`, `iterate`, `mine`, `get`).
- `client.game(slug)` returns a frozen object `{ slug, npcs, pcs, factions, items, documents }`,
  mirroring the `games/<slug>/...` URL nesting. A blank slug throws `UsageError`.
- Base classes: `Resource` (`list`, `iterate`, `get`, `create` as `POST`, `update` as `PATCH`,
  `pathFor`), `GameResource` (game-scoped families) and `CharacterResource` (shared by `Npcs`
  and `Pcs`, whose routes are parallel).
- There is no `delete`: none of these families' endpoints accept `DELETE`.
- Return values are plain parsed JSON; there are no model classes.

### Regular and restricted variants

The caller picks the restricted (`all.json` / `full.json`) variant with `{ restricted: true }`;
the default is the regular one. Each wrapper declares a static `variants` map
(action → `{ regular, restricted }`, `null` when absent), so adding a variant is a one-line
change.

| Family | `list` | `get` | `create` | `update` |
|---|---|---|---|---|
| `games` | regular | regular | — | — |
| `npcs` | `npcs/all` | `npcs/<id>/full` | `POST npcs/full` | `PATCH npcs/<id>/full` |
| `pcs` | regular | `pcs/<id>/full` | — (no PC create route) | `PATCH pcs/<id>/full` |
| `factions` | regular | regular | regular | regular |
| `items` | `items/all` | `items/<id>/full` | regular | regular |
| `documents` | `documents/all` | `documents/<id>/full` | regular | regular |

- Asking for a variant or an action that does not exist throws `UsageError` locally, before any
  request (`<Class> has no restricted variant for <action>`, `<Class> does not support
  <action>`). There is no silent downgrade and no automatic fallback on 403, which would hide
  scope problems and double requests.

### Not yet wrapped

Document pages (#1621), link routes (#1622) and photo uploads (#1623) are tracked by their own
issues, each of which updates this page, `client/README.md` and the
[consumer guide](../../guides/client.md) when it lands. The other families (`players`,
`common_items`, `possessions`, `recipes`, `treasures`, `sessions`, `polls`, `tasks`,
`conversations`, `miniatures`) are out of scope for now.

## Testing

- `new MajoraClient({ fetch })` accepts a fetch implementation, so specs pass a stub from
  `specs/support/` (`FetchStub.js`, `buildCore.js`); no spec makes a real network call or
  patches a global.
- Specs mirror `src/` (`specs/core/`, `specs/core/errors/`, `specs/resources/`, `specs/cli/`)
  and cover URL building per variant, headers, pagination and `iterate`, error mapping per
  status and body shape (including non-JSON bodies), the retry matrix, timeouts and aborts,
  configuration validation, and that no error ever contains the token.
