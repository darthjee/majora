# Issue: Client: core library

## Description

Part of epic #1592 (Majora client for automations, with fine-grained API tokens). Implement the
core of the Node.js library in `client/`, exactly as settled by #1598 in
[`docs/agents/specs/client/library.md`](../specs/client/library.md): configuration, the shared
HTTP layer, authentication, pagination, retries/timeouts and the typed error hierarchy.
`client/` is owned by the `client` agent; nothing outside it changes except documentation.

Out of scope: the resource wrappers and `client.game(slug)` / `client.games` (#1609, #1621,
#1622, #1623) and the CLI (`src/cli/`, `bin/majora.js`, the `bin` entry).

## Problem

`client/` was scaffolded by #1607 with only a placeholder module. The resource wrappers and the
CLI need a tested core to build on: one place that resolves configuration, sends authenticated
requests, reads pagination headers, retries safe requests and maps API errors to typed classes.

## Expected Behavior

- `new MajoraClient({ baseUrl, token, timeout, retries, fetch, allowInsecureHttp })` resolves
  its configuration (falling back to `MAJORA_URL` / `MAJORA_TOKEN`) and throws
  `ConfigurationError` at construction for a missing/invalid `baseUrl`, a missing token, or an
  insecure `http://` URL (allowed only for `localhost` / `127.0.0.1` or with
  `allowInsecureHttp: true`).
- Every request carries `Authorization: Bearer <token>` and targets a `.json` URL built from
  `baseUrl`.
- Non-2xx responses raise the matching `ApiError` subclass; no error ever contains the token or
  the request body.
- Paginated reads return a `Page`, and an async iterator walks items page by page.
- `GET` requests are retried on network errors and 429/502/503/504; writes never are.
- `make client-tests` and `make client-lint` are green, with no real network call in any spec.

## Solution

All under `client/` (client agent), following the module layout in the spec.

### `src/core/Config.js`

- Resolves `baseUrl`, `token`, `timeout` (default 30000 ms, `0` disables), `retries` (default
  2, `0` disables), `fetch` (default `globalThis.fetch`) and `allowInsecureHttp`.
- Environment fallback for `baseUrl` / `token` (`MAJORA_URL` / `MAJORA_TOKEN`); the environment
  is injectable so specs do not touch `process.env`.
- Strips a trailing slash, validates an absolute URL, enforces HTTPS-only with the
  `localhost` / `127.0.0.1` / `allowInsecureHttp` exceptions.

### `src/core/HttpClient.js`

- `request(method, path, { query, body, timeout, retries, signal })` plus `get` / `post` /
  `patch` / `delete` helpers; builds `<baseUrl>/<path>.json` URLs with query parameters.
- Sends the Bearer header; JSON bodies (`Content-Type: application/json`) and native
  `FormData` bodies (multipart, content type left to `fetch`) so #1623 needs no core change.
- Parses JSON responses, keeping the raw text when the body is not JSON or is empty.
- Timeouts via `AbortSignal.timeout`, combined with a caller `signal` via `AbortSignal.any`;
  a timeout raises `NetworkError` with `timeout === true` and `cause` set.
- Retries only `GET`: on `NetworkError` (not a caller abort), 502, 503, 504 and 429 (honoring
  `Retry-After`); never on other 4xx or 500. Exponential backoff with jitter (about 0.5 s, then
  1 s), with the sleep injectable so specs run instantly.
- Maps every non-2xx response to an error (below).

### `src/core/Page.js` and `src/core/Paginator.js`

- `Page`: `data`, `page`, `pages`, `perPage`, `total` read from the response headers, `hasNext`,
  and `next()` returning the next `Page` or `null`.
- Responses without pagination headers become a single page (`page = pages = 1`,
  `total = data.length`).
- `Paginator`: `list(path, { page, perPage, query })` returning a `Page`, and `iterate(...)`, an
  async iterator over items that fetches one page at a time and stops at `pages`, each page
  fetch retried independently. `perPage` is passed through only when given (no client default);
  filters in `query` cannot collide with `page` / `per_page`.

### `src/core/errors/` (one class per file)

`MajoraError` → `ConfigurationError`, `UsageError`, `NetworkError`, `ApiError` →
`ValidationError` (400, `fields`), `AuthenticationError` (401), `PermissionError` (403, `code`:
`scope_missing` | `game_not_allowed` | `token_not_allowed` | `null`), `NotFoundError` (404),
`ServerError` (5xx). Other statuses raise a plain `ApiError`.

- Every `ApiError` carries `status`, `method`, `path`, `body` and `codes` (flattened from
  `errors.<field>[]`, `errors.detail[]`, `detail`, `error`, `reason`).
- Messages like `403 PermissionError on GET /games/x/npcs/all.json: scope_missing`.
- Never the token, any request header or the request body.

### `src/MajoraClient.js` and `src/index.js`

- `MajoraClient` resolves the `Config`, builds the `HttpClient` and the `Paginator`, and
  exposes them as `http` and `paginator` properties for the resource wrappers of #1609; it has
  no resource accessors yet.
- `src/index.js` exports `MajoraClient` and every error class, nothing else; the placeholder
  `PACKAGE_NAME` / `packageName` and their spec are removed.
- `package.json`: add `"exports": "./src/index.js"` (no `bin` yet).

### Specs

Under `specs/core/` mirroring `src/`, with a `fetch` stub in `specs/support/`: configuration
validation and env fallback, URL and header building, JSON / multipart / non-JSON bodies,
pagination headers, `next()` and `iterate`, error mapping per status and body shape (including
an HTML 502), the retry / no-retry matrix including `Retry-After`, timeouts and abort, and that
no error exposes the token.

### Documentation

- `client/README.md`: a short library usage section (construction, errors, pagination); drop
  the placeholder notice for the library.
- `docs/agents/specs/client/library.md`: mark #1608 as implemented.

### Acceptance criteria

- `make client-tests`, `make client-lint` and `make client-coverage` are green; `client_tests`
  and `client_checks` pass in CI.
- #1609 can add wrappers under `src/resources/` without changing `core/`.

## Benefits

The resource wrappers and the CLI only describe routes and arguments; authentication, transport
security, pagination, retries and error handling live in one tested place.
