# Issue: Client spec: improve library.md

## Description

Part of epic #1592 (Majora client for automations, with fine-grained API tokens). The epic records the agreed design: scope, permission model, token lifecycle, client shape and token management permissions.

Review `docs/agents/specs/client/library.md`, written in the epic's first sub-issue, and fill its gaps before implementation starts. Topic: the Node library core (#1608) and the first resource wrappers (#1609, plus #1621, #1622 and #1623 split out of it here). The decisions below were settled in discussion; this issue writes them into the spec.

## Problem

- `library.md` leaves six open questions: the first resources, the wrapper actions and signatures, the pagination API, the error classes, retries and timeouts, and the module layout.
- It speaks of "characters", while the scope catalogue (`scopes.md`) splits `pcs` and `npcs`.
- It ignores that most reads and writes exist in a regular and a restricted (`all.json` / `full.json`) variant, and that none of the first families accept `DELETE`.
- #1609 as written (all extras, a `delete` action) is too large and partly wrong.

## Expected Behavior

`docs/agents/specs/client/library.md` has no unresolved open questions and is ready to drive #1608, #1609, #1621, #1622 and #1623; the hub lists the new sub-issues; #1609's body matches the narrowed scope.

## Solution

### Module layout

Settles the "module layout" open question.

```
client/
  package.json            # "type": "module", "exports": "./src/index.js", "bin": { "majora": "./bin/majora.js" }
  bin/
    majora.js             # CLI shim: imports src/cli and runs it
  src/
    index.js              # public exports: MajoraClient and the error classes, nothing else
    MajoraClient.js       # entry: resolves config, builds HttpClient, exposes resource wrappers
    core/
      Config.js           # options + MAJORA_URL / MAJORA_TOKEN fallback, validation
      HttpClient.js       # fetch, Bearer header, .json URLs, JSON bodies, error mapping
      Page.js             # one page: data + page/pages/perPage/total from headers
      Paginator.js        # iterates pages
      errors/             # one class per file (MajoraError, AuthenticationError, ...)
    resources/
      Resource.js         # base wrapper built on HttpClient
      GameResource.js     # base for game-scoped families (games/<slug>/<family>)
      Npcs.js, Pcs.js, …  # one file per scope family
    cli/                  # internal layout settled by #1599
  specs/
    support/              # fetch stub, fixtures
    core/, resources/, cli/   # mirrors src/
```

- **One class per file, PascalCase**, matching the frontend's conventions; Jasmine-style specs
  mirror `src/` under `specs/`.
- **`src/index.js` is the only public surface.** `package.json`'s `exports` points at it, so
  `core/` internals can be refactored without a breaking release.
- **Resource files are named after scope families** (`Npcs.js`, `Pcs.js`, not `Characters.js`),
  so each wrapper maps one-to-one onto the scope it needs (see `scopes.md`).
- **`core/` vs `resources/` mirrors the split between #1608 and #1609**: #1608 touches `core/`,
  `MajoraClient.js` and `index.js`; #1609 adds files under `resources/`.
- **The CLI lives in `src/cli/`** with a thin `bin/majora.js` shim, so it is testable like the
  rest; its internal layout belongs to #1599.
- **Rejected:** a flat `src/` (does not scale past a handful of wrappers and error classes);
  separate packages for core and CLI (contradicts the single package in `packaging.md`).

### First resource set

Settles the "which resources come first" open question. Families are named after the scope families in `scopes.md`, not "characters".

- **Plain resources (#1609):**
  - `games`: read-only (`games.json`, `my-games.json`, `games/<slug>.json`), so callers can
    discover the slugs their token can reach;
  - `npcs` and `pcs`, on one shared character base (their routes are parallel, built by
    `backend/games/urls/_character_routes.py`);
  - `factions`, `items`, `documents`.
- **Document pages (#1621):** `documents/<id>/pages…`, including `bump_version`.
- **Link routes (#1622):** character ↔ faction / document / item (`available`, `acquire`,
  `remove`), plus the reverse lists (faction members, item holders, document characters). Scope
  rules follow `scopes.md` (write on the owning family).
- **Photo uploads (#1623):** the two-step flow — `POST …/<id>/photo_upload.json` (returns
  `upload_id` and `token`), then `POST /uploads/image/<upload_id>/submit` with the file as
  `multipart/form-data` (field `file`) — plus `photos/<photo_id>/set.json` and character photo
  deletion.
- **Core impact (#1608):** the HTTP layer must support `multipart/form-data` bodies (native
  `FormData`/`Blob`, no dependency), in addition to JSON.
- **Out of the first set:** the other 10 families (`players`, `common_items`, `possessions`,
  `recipes`, `treasures`, `sessions`, `polls`, `tasks`, `conversations`, `miniatures`) and
  document files.
- **Delivery:** #1609 is narrowed to the plain resources; #1621, #1622 and #1623 were spawned as
  sub-issues of epic #1592. The hub's sub-issue table and order need the three new rows
  (#1621 and #1622 after #1609; #1623 after #1608 and #1609), and #1609's body must be narrowed.

### Wrapper actions and signatures

Settles the "actions and signatures" open question.

- **Game-bound accessor.** Game-scoped families hang off `client.game(slug)`, mirroring the
  `games/<slug>/...` URL nesting; `games` itself is top-level and read-only:

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

- **Actions.** `list`, `get`, `create`, `update` for `npcs`, `pcs`, `factions`, `items`,
  `documents`. **No `delete`**: none of these families' endpoints accept `DELETE`. `update` sends
  a `PATCH` (partial update). `games` is `list`, `mine`, `get` only.
- **Return values.** Plain parsed JSON objects — no model classes. `list` returns the page shape
  settled under the pagination topic.
- **Regular vs restricted variant: explicit option.** `{ restricted: true }` maps each action to
  its restricted URL, following `docs/agents/access-control/character.md` and the per-family
  access-control pages:

  ```js
  await game.npcs.list({ restricted: true });         // npcs/all.json
  await game.npcs.get(12, { restricted: true });      // npcs/12/full.json
  await game.npcs.create(data, { restricted: true }); // npcs/full.json
  await game.npcs.update(12, data, { restricted: true }); // PATCH npcs/12/full.json
  ```

  - The default is the regular variant.
  - **No automatic fallback** (for example retrying the regular URL on 403): it would hide scope
    problems and double requests.
  - **No silent downgrade.** Asking for `restricted` where the family has no such variant (for
    example `pcs.list`, which has no `pcs/all.json` yet) throws a usage error locally, before any
    request.
  - Each wrapper declares its variant map (action → regular URL, restricted URL or none), so
    adding a variant later is a one-line change.
- **Rejected:** a slug argument on every call (`client.npcs.list(slug, ...)`); separate
  `listAll()`/`getFull()` methods; a client-level restricted default; auto fallback on 403.
- The extras (#1621 pages, #1622 links, #1623 photos) follow the same shape, nested under their
  parent resource; their exact methods are settled in those issues.

### Pagination API

Settles the "pagination API" open question. Follows `docs/agents/pagination.md`: `page`/`per_page` query params, `page`/`pages`/
`per_page`/`total` response headers, results ordered by `id`.

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
- **Filters go in `query`**, a separate object passed through as query params (for example
  `name`, `slain`), so they cannot collide with the library's own options (`page`, `perPage`,
  `restricted`).
- **No client-side default page size.** `perPage` is passed through as-is; when omitted, the
  server default (`MAJORA_PAGINATION_SIZE`, 24) applies, for `iterate` too.
- **Known limitation:** pagination is offset-based, so items created or deleted during an
  iteration can be skipped or repeated. Documented, not worked around.
- **Rejected:** a `listAll()` returning one big array (unbounded memory; `iterate` covers it, and
  callers can use `Array.fromAsync`); cursor pagination (the API has none).

### Error class hierarchy

Settles the "error class hierarchy" open question.

The API's current error shapes, which the library maps:

| Status | Body | Source |
|---|---|---|
| 400 | `{"errors": {"<field>": ["<code>", ...]}}` (codes, not messages) | `validated_or_error` / `save_or_error` |
| 401 | DRF default `{"detail": ...}`, code `token_invalid`, `WWW-Authenticate: Bearer …` | `tokens.md` |
| 403 (scope) | `{"errors": {"detail": ["scope_missing" \| "game_not_allowed" \| "token_not_allowed"]}}` | `scopes.md` |
| 403 (role) | DRF `{"detail": ...}` or empty | existing views |
| 404 | empty or `{"detail": "Not found."}` | `hidden_gate_response`, `get_object_or_404` |
| 422 | `{"status": "failed", "error": "<code>"}` | proxy upload handlers |
| 5xx / 502 | possibly non-JSON (HTML from the proxy or web server) | — |

Hierarchy (one class per file in `src/core/errors/`, all exported from `src/index.js`):

```
MajoraError                      base for everything the library throws
├── ConfigurationError           local: missing baseUrl/token, invalid URL
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
  of every code found in `errors.<field>[]`, `errors.detail[]` or `detail`).
- Statuses without a subclass (409, 422, …) raise a plain `ApiError`.
- **`instanceof` is the contract**: subclass by status, refined by `code`
  (`err instanceof PermissionError && err.code === 'scope_missing'`).
- **Errors never carry the token**: no `Authorization` or other request headers in `message`,
  `body` or any property; request bodies are not attached either (they may hold private
  campaign content).
- **Messages are human-readable**, for example
  `403 PermissionError on GET /games/x/npcs/all.json: scope_missing`.
- `PermissionError` keeps Majora's wording; Node has no built-in of that name to shadow.
- **Rejected:** one flat error with a `status` field (callers would switch on numbers); one
  class per scope code (`code` covers it).

### Retries and timeouts

Settles the "retries or timeouts" open question. Context: the API has no throttling on the endpoints a scoped token can reach (only the
unauthenticated authorization-request endpoints are throttled), so the real failure modes are
network errors, proxy 502/503/504 during a deploy or restart, and a slow backend.

#### Timeouts

- **On by default.** Every request gets `AbortSignal.timeout(ms)` (native on Node 20, no
  dependency). Default 30 s, set by `new MajoraClient({ timeout })`, overridable per call
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

### Configuration and transport security

- `baseUrl` is normalized (a trailing slash is stripped) and validated as an absolute URL;
  a missing or invalid `baseUrl` or a missing `token` (after the `MAJORA_URL` / `MAJORA_TOKEN`
  fallback) throws `ConfigurationError` when the client is constructed, before any request.
- **HTTPS only, with an opt-in for HTTP.** An `http://` `baseUrl` throws `ConfigurationError`
  unless the host is `localhost` / `127.0.0.1`, or `allowInsecureHttp: true` is passed (needed
  for docker-compose service hostnames). The Bearer token must not travel in clear text by
  accident.

### Testing strategy

- **Injectable `fetch`.** `new MajoraClient({ fetch })` accepts a fetch implementation,
  defaulting to `globalThis.fetch`; specs pass a stub from `specs/support/`, so no test makes a
  real network call and no global is patched. The test runner itself is settled by #1600.
- Each implementation issue (#1608, #1609, #1621, #1622, #1623) covers its own behavior with unit
  tests: URL building per variant, headers (Bearer, JSON, multipart), pagination headers and
  `iterate`, error mapping per status and body shape (including non-JSON bodies), the
  retry/no-retry matrix, timeouts and abort, configuration validation, and that no error ever
  contains the token.

### Documentation updates (this issue's PR)

- Rewrite `docs/agents/specs/client/library.md` with every decision above, replacing its
  **Open questions** section and the "characters" wording with the scope family names.
- Update the hub `docs/agents/specs/client.md`: add #1621, #1622 and #1623 to the sub-issue
  table (agent `client`) and to the order (#1621 and #1622 after #1609; #1623 after #1608 and
  #1609).
- Edit #1609's GitHub body: plain resources only (`games` read-only, `npcs`, `pcs`, `factions`,
  `items`, `documents`), actions `list`/`get`/`create`/`update` (no `delete`), pointing at the
  split-out issues.
- Note on `cli.md` (#1599's to settle): the CLI's `--game 3` example should use a slug, and its
  resources follow the families above.

## Benefits

- Implementation issues start from a concrete, reviewed API surface instead of guesses.
- Safe defaults: no write retried, no token in errors or over clear HTTP, no silent fallback to a different endpoint variant.
- Smaller, independently shippable wrapper issues.
