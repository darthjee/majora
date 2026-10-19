# Library

The Node.js library in the new top-level `client/` folder: the core that automations import, and
the first resource wrappers built on it. Part of the [client spec](../client.md) (epic #1592).
Refined by #1598 and implemented by #1608 (core), #1609 (plain resource wrappers), #1621
(document pages), #1622 (link routes) and #1623 (photo uploads).

**Status:** the core (#1608) is implemented in `client/src/core/` and `client/src/MajoraClient.js`;
the resource wrappers are not yet.

## Overview

Automations import the library to call the Majora API with a scoped token (see
[Tokens](tokens.md)). It has a generic core (configuration, HTTP, authentication, pagination,
errors) and a first set of resource wrappers. The [CLI](cli.md) is a thin layer on top.

The top-level `client/` is **unrelated** to `frontend/assets/js/client/`, which holds the SPA's
own API clients. They share no code and no owner.

## Decisions

### Language and runtime

- Plain JavaScript with ES modules and JSDoc types. No build step, no TypeScript compilation.
- Native `fetch`, so it needs Node 20 or later. No HTTP dependency.

### Configuration and transport security

- The entry point is
  `new MajoraClient({ baseUrl, token, timeout, retries, fetch, allowInsecureHttp })`.
- When `baseUrl` or `token` is omitted, the library falls back to the `MAJORA_URL` and
  `MAJORA_TOKEN` environment variables.
- `baseUrl` is normalized (a trailing slash is stripped) and validated as an absolute URL.
- A missing or invalid `baseUrl`, or a missing `token` (after the environment fallback), throws
  `ConfigurationError` when the client is constructed, before any request.
- **HTTPS only, with an opt-in for HTTP.** An `http://` `baseUrl` throws `ConfigurationError`
  unless the host is `localhost` / `127.0.0.1`, or `allowInsecureHttp: true` is passed (needed
  for docker-compose service hostnames). The Bearer token must never travel in clear text by
  accident.
- `timeout`, `retries` and `fetch` are described under
  [Retries and timeouts](#retries-and-timeouts) and [Testing strategy](#testing-strategy).

### Module layout

```text
client/
  package.json            # "type": "module", "exports": "./src/index.js", "bin": { "majora": "./bin/majora.js" }
  bin/
    majora.js             # CLI shim: imports src/cli and runs it
  src/
    index.js              # public exports: MajoraClient and the error classes, nothing else
    MajoraClient.js       # entry: resolves config, builds HttpClient, exposes resource wrappers
    core/
      Config.js           # options + MAJORA_URL / MAJORA_TOKEN fallback, validation
      HttpClient.js       # fetch, Bearer header, .json URLs, JSON and multipart bodies, error mapping
      Page.js             # one page: data + page/pages/perPage/total from headers
      Paginator.js        # iterates pages
      errors/             # one class per file (MajoraError, AuthenticationError, ...)
    resources/
      Resource.js         # base wrapper built on HttpClient
      GameResource.js     # base for game-scoped families (games/<slug>/<family>)
      Npcs.js, Pcs.js, …  # one file per scope family
    cli/                  # see cli.md, Internal layout
  specs/
    support/              # fetch stub, fixtures
    core/, resources/, cli/   # mirrors src/
```

- **One class per file, PascalCase**, matching the frontend's conventions. Jasmine-style specs
  mirror `src/` under `specs/`.
- **`src/index.js` is the only public surface.** `package.json`'s `exports` points at it, so
  `core/` internals can be refactored without a breaking release.
- **Resource files are named after scope families** (`Npcs.js`, `Pcs.js`, not `Characters.js`),
  so each wrapper maps one-to-one onto the scope it needs (see [Scopes](scopes.md)).
- **`core/` vs `resources/` mirrors the split between #1608 and #1609**: #1608 touches `core/`,
  `MajoraClient.js` and `index.js`; #1609 (and #1621–#1623) add files under `resources/`.
- **The CLI lives in `src/cli/`** with a thin `bin/majora.js` shim, so it is testable like the
  rest. Its internal layout is in [CLI](cli.md#internal-layout-srccli).
- **Rejected:** a flat `src/` (does not scale past a handful of wrappers and error classes);
  separate packages for core and CLI (contradicts the single package in
  [Packaging](packaging.md)).

### Core

- **Auth.** Every request carries `Authorization: Bearer <token>`.
- **URLs.** A shared HTTP layer (`HttpClient`) builds `.json` URLs from `baseUrl`.
- **Bodies.** It sends JSON bodies, and `multipart/form-data` bodies built with the native
  `FormData` / `Blob` (no dependency) for photo uploads (#1623). It parses JSON responses, and
  keeps the raw text when a response is not JSON.
- **Errors.** Every non-2xx response is mapped to a typed error (see [Errors](#errors)).

### Pagination

Follows [`pagination.md`](../../pagination.md): `page` / `per_page` query parameters,
`page` / `pages` / `per_page` / `total` response headers, results ordered by `id`.

```js
const page = await game.npcs.list({ page: 2, perPage: 50, restricted: true, query: { name: 'Bob' } });
page.data      // array of plain objects
page.page      // 2
page.pages     // 7
page.perPage   // 50
page.total     // 330
page.hasNext   // true
await page.next() // the next Page, or null on the last one

for await (const npc of game.npcs.iterate({ restricted: true, query: { slain: false } })) { /* ... */ }
```

- **Both styles, one `Page` object.** `list` returns a `Page`; `iterate` is an async iterator over
  **items**, fetching one page at a time on demand and stopping at `pages`.
- **Uniform shape.** Non-paginated list endpoints (for example `my-games.json`) still return a
  `Page`: `page = pages = 1`, `total = data.length`.
- **Filters go in `query`**, a separate object passed through as query parameters (for example
  `name`, `slain`), so they cannot collide with the library's own options (`page`, `perPage`,
  `restricted`).
- **No client-side default page size.** `perPage` is passed through as-is; when omitted, the
  server default (`MAJORA_PAGINATION_SIZE`, 24) applies, for `iterate` too.
- **Known limitation:** pagination is offset-based, so items created or deleted during an
  iteration can be skipped or repeated. Documented, not worked around.
- **Rejected:** a `listAll()` returning one big array (unbounded memory; `iterate` covers it, and
  callers can use `Array.fromAsync`); cursor pagination (the API has none).

### Errors

The API's current error shapes, which the library maps:

| Status | Body | Source |
|---|---|---|
| 400 | `{"errors": {"<field>": ["<code>", ...]}}` (codes, not messages) | `validated_or_error` / `save_or_error` |
| 401 | DRF default `{"detail": ...}`, code `token_invalid`, `WWW-Authenticate: Bearer …` | [Tokens](tokens.md) |
| 403 (scope) | `{"errors": {"detail": ["scope_missing" \| "game_not_allowed" \| "token_not_allowed"]}}` | [Scopes](scopes.md) |
| 403 (role) | DRF `{"detail": ...}` or empty | existing views |
| 404 | empty or `{"detail": "Not found."}` | `hidden_gate_response`, `get_object_or_404` |
| 422 (upload) | `{"error": "Unprocessable Entity", "reason": "<code>", ...}` | proxy `UploadHandler` |
| 422 (link) | `{"status": "failed", "error": "<code>"}` | proxy `LinkHandler` |
| 5xx / 502 | possibly non-JSON (HTML from the proxy or web server) | — |

Hierarchy (one class per file in `src/core/errors/`, all exported from `src/index.js`):

```text
MajoraError                      base for everything the library throws
├── ConfigurationError           local: missing baseUrl/token, invalid or insecure URL
├── UsageError                   local: e.g. restricted variant not available, bad arguments
├── NetworkError                 fetch rejected (DNS, connection refused, timeout); `cause` set
└── ApiError                     any non-2xx response
    ├── ValidationError     400  `fields`: { name: ['blank'], ... }
    ├── AuthenticationError 401
    ├── PermissionError     403  `code`: scope_missing | game_not_allowed | token_not_allowed | null (role denial)
    ├── NotFoundError       404
    └── ServerError         5xx
```

- **Every `ApiError` carries** `status`, `method`, `path`, `body` (parsed JSON, or the raw text
  when the response is not JSON, so an HTML 502 never breaks parsing) and `codes` (a flat list
  of every code found in `errors.<field>[]`, `errors.detail[]`, `detail`, `error` or `reason`).
- Statuses without a subclass (409, 422, …) raise a plain `ApiError`.
- **`instanceof` is the contract**: subclass by status, refined by `code`
  (`err instanceof PermissionError && err.code === 'scope_missing'`).
- **Errors never carry the token**: no `Authorization` or other request header in `message`,
  `body` or any property. Request bodies are not attached either (they may hold private
  campaign content).
- **Messages are human-readable**, for example
  `403 PermissionError on GET /games/x/npcs/all.json: scope_missing`.
- `PermissionError` keeps Majora's wording; Node has no built-in of that name to shadow.
- **Rejected:** one flat error with a `status` field (callers would switch on numbers); one
  class per scope code (`code` covers it).

### Retries and timeouts

The API has no throttling on the endpoints a scoped token can reach (only the unauthenticated
authorization-request endpoints are throttled), so the real failure modes are network errors,
proxy 502/503/504 during a deploy or restart, and a slow backend.

#### Timeouts

- **On by default.** Every request gets `AbortSignal.timeout(ms)` (native on Node 20, no
  dependency). Default 30 s, set by `new MajoraClient({ timeout })`, overridable per call with
  `{ timeout }`; `0` disables it.
- A timeout throws `NetworkError` with `cause` set to the abort reason and `timeout === true`.
- A caller-supplied `{ signal }` is combined with the timeout via `AbortSignal.any`.
- Photo submits (#1623) may need a longer timeout; that issue decides.

#### Retries

- **Only safe requests are retried:**

  | Request | Retried | Why |
  |---|---|---|
  | `GET` | yes | safe and idempotent |
  | `PATCH` | no | often idempotent, but `links` syncing and `bump_version` are not |
  | `POST` (create, upload init/submit, link `acquire`) | never | a retry after a lost response would duplicate content |

- **Retried on:** `NetworkError` (except a caller-initiated abort), 502, 503, 504, and 429
  (honoring `Retry-After`) should throttling ever be added. **Never** on other 4xx or on 500
  (deterministic; retrying hides bugs).
- **Defaults:** `retries: 2`, exponential backoff with jitter (about 0.5 s, then 1 s). Set by
  `new MajoraClient({ retries })`, overridable per call; `0` disables.
- **`iterate` retries each page fetch independently**, so a blip on page 5 does not restart from
  page 1.
- **Rejected:** retrying writes (duplicates; an idempotency key would need backend support that
  does not exist); no retries at all (a deploy restart would break long automations iterating
  many pages); a retry library dependency (about 30 lines of code).

### Resource wrappers

The core is generic. Resource wrappers sit on top of it, one per scope family (see
[Scopes](scopes.md)). This epic delivers only a first set; full API coverage is out of scope.
A wrapper only works within its token's scopes; it does not check scopes itself, the API does.

#### First resource set

- **Plain resources (#1609):**
  - `games`: read-only (`games.json`, `my-games.json`, `games/<slug>.json`), so callers can
    discover the slugs their token can reach;
  - `npcs` and `pcs`, on one shared character base (their routes are parallel, built by
    `backend/games/urls/_character_routes.py`);
  - `factions`, `items`, `documents`.
- **Document pages (#1621):** `documents/<id>/pages…`, including `bump_version`.
- **Link routes (#1622):** character ↔ faction / document / item (`available`, `acquire`,
  `remove`, each with its `/all.json` variant; faction removal is per faction,
  `factions/<faction_id>/remove.json`), plus the faction members list
  (`factions/<id>/characters.json`) and the per-character item / document summaries
  (`items/<id>/<pcs|npcs>/<character_id>/summary.json`, same for documents). The API has no
  item-holders or document-characters list. Scope rules follow [Scopes](scopes.md) (write on the
  owning family).
- **Photo uploads (#1623):** the two-step flow — `POST …/<id>/photo_upload.json` (returns
  `upload_id` and `token`), then `POST /uploads/image/<upload_id>/submit` with the file as
  `multipart/form-data` (field `file`) — plus `PATCH photos/<photo_id>/set.json` and
  `DELETE photos/<photo_id>.json` (the proxy deletes the stored file before forwarding it).
- **Out of the first set:** the other 10 families (`players`, `common_items`, `possessions`,
  `recipes`, `treasures`, `sessions`, `polls`, `tasks`, `conversations`, `miniatures`) and
  document files.

#### Game-bound accessor

Game-scoped families hang off `client.game(slug)`, mirroring the `games/<slug>/...` URL nesting;
`games` itself is top-level and read-only:

```js
const game = client.game('epic-quest');
await game.npcs.list({ page: 2 });
await game.npcs.get(12);
await game.npcs.create({ name: 'Bob' });
await game.npcs.update(12, { name: 'Robert' });

await client.games.list();        // games.json
await client.games.mine();        // my-games.json
await client.games.get('epic-quest');
```

#### Actions

- `list`, `get`, `create`, `update` for `npcs`, `factions`, `items` and `documents`; `list`,
  `get`, `update` for `pcs` (the API has no PC create route: `pcs.json` is `GET` only). `list`
  also has its `iterate` counterpart (see [Pagination](#pagination)).
- **No `delete`**: none of these families' endpoints accept `DELETE`.
- `update` sends a `PATCH` (partial update).
- `games` is `list`, `mine` and `get` only.
- **Return values** are plain parsed JSON objects — no model classes. `list` returns a `Page`.

#### Regular and restricted variants

Most reads and writes exist in a regular and a restricted (`all.json` / `full.json`) variant
(see [`access-control/character.md`](../../access-control/character.md) and the per-family
access-control pages). The caller picks one with an explicit `{ restricted: true }` option:

```js
await game.npcs.list({ restricted: true });             // npcs/all.json
await game.npcs.get(12, { restricted: true });          // npcs/12/full.json
await game.npcs.create(data, { restricted: true });     // POST npcs/full.json
await game.npcs.update(12, data, { restricted: true }); // PATCH npcs/12/full.json
```

- The default is the regular variant.
- Restricted variants available today (from `backend/games/urls/`):

  | Family | `list` | `get` | `create` | `update` |
  |---|---|---|---|---|
  | `npcs` | `npcs/all.json` | `npcs/<id>/full.json` | `POST npcs/full.json` | `PATCH npcs/<id>/full.json` |
  | `pcs` | — | `pcs/<id>/full.json` | — (no create at all) | `PATCH pcs/<id>/full.json` |
  | `factions` | — | — | — | — |
  | `items` | `items/all.json` | `items/<id>/full.json` | — | — |
  | `documents` | `documents/all.json` | `documents/<id>/full.json` | — | — |

- **No automatic fallback** (for example retrying the regular URL on 403): it would hide scope
  problems and double requests.
- **No silent downgrade.** Asking for `restricted` where the family has no such variant (for
  example `pcs.list`, which has no `pcs/all.json` yet) throws `UsageError` locally, before any
  request.
- Each wrapper declares its variant map (action → regular URL, restricted URL or none), so
  adding a variant later is a one-line change.
- **Rejected:** a slug argument on every call (`client.npcs.list(slug, ...)`); separate
  `listAll()` / `getFull()` methods; a client-level restricted default; automatic fallback on
  403.

The extras (#1621 pages, #1622 links, #1623 photos) follow the same shape, nested under their
parent resource; their exact methods are settled in those issues.

### Testing strategy

- **Injectable `fetch`.** `new MajoraClient({ fetch })` accepts a fetch implementation,
  defaulting to `globalThis.fetch`. Specs pass a stub from `specs/support/`, so no test makes a
  real network call and no global is patched. The test runner itself is settled by #1600.
- Each implementation issue (#1608, #1609, #1621, #1622, #1623) covers its own behavior with unit
  tests: URL building per variant, headers (Bearer, JSON, multipart), pagination headers and
  `iterate`, error mapping per status and body shape (including non-JSON bodies), the
  retry/no-retry matrix, timeouts and abort, configuration validation, and that no error ever
  contains the token.

## Open questions

None remain: #1598 settled them all.

The hand-off to #1599 is resolved: the [CLI](cli.md) page now uses a game slug in its examples,
and its resources follow the scope families above.

## Affected code

- `client/`: new top-level folder, owned by the `client` agent (added by #1601).
- [`pagination.md`](../../pagination.md): the API pagination contract the core follows.
- [`access-control/character.md`](../../access-control/character.md) and the per-family
  access-control pages: the regular and restricted variants the wrappers map.
- [`architecture/proxy.md`](../../architecture/proxy.md): the image upload submit flow used by
  #1623.
- `backend/games/urls/`: the routes the wrappers call (`_character_routes.py` for `npcs` and
  `pcs`).
- `crawler/` (see [`crawler.md`](../../crawler.md)): an existing Node.js client using the
  legacy token. Unchanged; useful only as a reference.
- `frontend/assets/js/client/`: unrelated, despite the name.
