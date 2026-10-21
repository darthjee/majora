# majora-client

Node.js library and command-line client for the [Majora](https://github.com/darthjee/majora)
RPG campaign manager API, meant for automations.

> **Work in progress.** This package is being built as part of epic #1592. The core library
> (configuration, HTTP, pagination, retries and errors), the resource wrappers
> (`client.games`, `client.game(slug)`, including document pages, character links and photo
> uploads) and the [`majora` CLI](#cli) are available; the CLI has no photo command yet.

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

### Resources

Resource wrappers map one-to-one onto the token scope families. They return plain parsed JSON
(no model classes); `list` returns a `Page` (see [Pagination](#pagination)) and `iterate`
yields every item, one page at a time. A wrapper does not check scopes itself: the API does.

#### Games (top-level, read-only)

```js
await client.games.list({ page: 2 });  // games.json, returns a Page
client.games.iterate();                // every game, page by page
await client.games.mine();             // my-games.json, returns the plain array (not paginated)
await client.games.get('epic-quest');  // games/epic-quest.json
```

#### Game-scoped families

`client.game(slug)` returns the wrappers bound to one game (`games/<slug>/...`). It makes no
request; a missing or empty slug throws `UsageError`.

```js
const game = client.game('epic-quest');

await game.npcs.list({ page: 2, perPage: 50, query: { name: 'Bob' } });
for await (const npc of game.npcs.iterate()) { /* ... */ }
await game.npcs.get(12);
await game.npcs.create({ name: 'Bob' });             // POST
await game.npcs.update(12, { name: 'Robert' });      // PATCH (partial update)
```

| Family | Actions |
|---|---|
| `game.npcs` | `list` (+ `iterate`), `get`, `create`, `update` |
| `game.pcs` | `list` (+ `iterate`), `get`, `update` — no `create` (the API has no PC create route) |
| `game.factions` | `list` (+ `iterate`), `get`, `create`, `update`, `characters` (+ `iterateCharacters`), `summary` |
| `game.items` | `list` (+ `iterate`), `get`, `create`, `update`, `summary` |
| `game.documents` | `list` (+ `iterate`), `get`, `create`, `update`, `summary` |
| `game.documents.pages(id)` | `list` (+ `iterate`), `create`, `update`, `trim`, `bumpVersion` — no `get` |
| `game.npcs.items(id)` (and `documents(id)`, `factions(id)`; same on `pcs`) | `list` (+ `iterate`), `get`, `available` (+ `iterateAvailable`), `acquire`, `remove` |

There is **no per-record `delete`**: the only `DELETE` is the bulk `pages(id).trim(keep)`.
Every action also accepts the request options `headers`, `timeout`, `retries` and `signal`
(and `query`; `list` / `iterate` add `page` and `perPage`). Slugs and ids are URL-encoded.

#### Regular and restricted variants

The regular variant is the default. `{ restricted: true }` selects the restricted URL
(`all.json` / `full.json`), which needs the matching restricted scope:

```js
await game.npcs.list({ restricted: true });             // npcs/all.json
await game.npcs.get(12, { restricted: true });          // npcs/12/full.json
await game.npcs.create(data, { restricted: true });     // POST npcs/full.json
await game.npcs.update(12, data, { restricted: true }); // PATCH npcs/12/full.json
```

| Family | `list` | `get` | `create` | `update` |
|---|---|---|---|---|
| `npcs` | `npcs/all.json` | `npcs/<id>/full.json` | `POST npcs/full.json` | `PATCH npcs/<id>/full.json` |
| `pcs` | — | `pcs/<id>/full.json` | — (no create at all) | `PATCH pcs/<id>/full.json` |
| `factions` | — | — | — | — |
| `items` | `items/all.json` | `items/<id>/full.json` | — | — |
| `documents` | `documents/all.json` | `documents/<id>/full.json` | — | — |

`games` has no restricted variant.

Asking for a variant or an action that does not exist (for example `game.pcs.list({ restricted:
true })` or `game.pcs.create(...)`), or passing a blank id or slug, throws `UsageError`
locally, before any request. There is **no automatic fallback** to the regular URL (for
example on a 403): it would hide scope problems.

#### Document pages

`game.documents.pages(documentId)` wraps `games/<slug>/documents/<id>/pages` (a blank id throws
`UsageError`). Every action has a restricted `all.json` variant, and there is no per-page `get`
or `delete`:

```js
const pages = client.game('epic-quest').documents.pages(7);
await pages.list({ restricted: true });                     // GET documents/7/pages/all.json
await pages.create({ content, order: 1, version: 2 });      // POST documents/7/pages.json
await pages.update(12, { content, version: 2 });            // PATCH documents/7/pages/12.json
await pages.trim(3);                                        // DELETE documents/7/pages.json {keep: 3}
await pages.bumpVersion({ version: 2, exclude_ids: [12] }); // PATCH documents/7/pages/bump_version.json
```

| Action | Regular | Restricted |
|---|---|---|
| `list` | `pages.json` | `pages/all.json` |
| `create` | `POST pages.json` | `POST pages/all.json` |
| `update` | `PATCH pages/<page_id>.json` | `PATCH pages/<page_id>/all.json` |
| `trim` | `DELETE pages.json` | `DELETE pages/all.json` |
| `bumpVersion` | `PATCH pages/bump_version.json` | `PATCH pages/bump_version/all.json` |

`trim(keep)` archives then deletes every page with `order > keep`; `bumpVersion(data)` sends
its body as-is. Both resolve with no meaningful value (the API answers `204` / an empty `200`),
and neither is retried. Listing needs `documents:read`, everything else `documents:write`.

#### Character links

`game.npcs.items(characterId)`, `game.npcs.documents(characterId)` and
`game.npcs.factions(characterId)` (the same on `game.pcs`) wrap
`games/<slug>/<npcs|pcs>/<character_id>/<items|documents|factions>` (a blank id throws
`UsageError`). Every action has a restricted variant:

```js
const items = client.game('epic-quest').npcs.items(12);
await items.list();                                     // GET npcs/12/items.json
await items.get(3, { restricted: true });               // GET npcs/12/items/3/full.json
await items.available();                                // GET npcs/12/items/available.json
await items.acquire({ game_item_id: 3 });               // POST npcs/12/items/acquire.json
await items.remove({ game_item_id: 3 });                // POST npcs/12/items/remove.json

const factions = client.game('epic-quest').pcs.factions(4);
await factions.remove(5);                               // POST pcs/4/factions/5/remove.json
```

| Action | Regular | Restricted |
|---|---|---|
| `list` | `<link>.json` | `<link>/all.json` |
| `get` | `<link>/<id>.json` | `<link>/<id>/full.json` |
| `available` | `<link>/available.json` | `<link>/available/all.json` |
| `acquire` | `POST <link>/acquire.json` | `POST <link>/acquire/all.json` |
| `remove` (items, documents) | `POST <link>/remove.json` | `POST <link>/remove/all.json` |
| `remove` (factions) | `POST factions/<id>/remove.json` | `POST factions/<id>/remove/all.json` |

- `list` and `available` return a `Page`; `iterate` and `iterateAvailable` walk every page.
- `acquire(data)` and `remove(data)` send their body as-is; items and documents name the target
  in the body, while factions are removed one at a time with `remove(factionId, data = {})`.
- `acquire` and `remove` are `POST`s, so they are **never retried**. A refused link answers
  `422` (`{"status": "failed", "error": "<code>"}`), raised as an `ApiError` whose `codes` hold
  the error code.
- Scopes: a link write needs `write` on the character family (`npcs:write` for
  `npcs/<id>/items/acquire.json`); the restricted `acquire` / `remove` also need `read` on the
  linked family (`documents:read` for `npcs/<id>/documents/acquire/all.json`).

The linked families have two related reads, each with a restricted `all.json` variant:

```js
const game = client.game('epic-quest');
await game.factions.characters(5);                      // GET factions/5/characters.json (a Page)
for await (const member of game.factions.iterateCharacters(5)) { /* ... */ }
await game.items.summary(3, 'npcs', 12);                // GET items/3/npcs/12/summary.json
await game.documents.summary(7, 'pcs', 4, { restricted: true }); // GET documents/7/pcs/4/summary/all.json
```

`summary(id, kind, characterId)` exists on `items`, `documents` and `factions`; `kind` must be
`'pcs'` or `'npcs'`, otherwise `UsageError`. The API has no item-holders or
document-characters list.

#### Photos

PCs, NPCs, factions, items and documents take photo uploads; PCs, NPCs and documents can pick
their main photo, and only characters can delete one:

```js
import { readFile } from 'node:fs/promises';

const npcs = client.game('epic-quest').npcs;
const buffer = await readFile('portrait.png');            // the library never reads files itself
const { file_path } = await npcs.uploadPhoto(12, buffer, {
  filename: 'portrait.png', contentType: 'image/png',
});                                                        // POST npcs/12/photo_upload.json + submit
await npcs.setMainPhoto(12, 3);                            // PATCH npcs/12/photos/3/set.json
await npcs.deletePhoto(12, 3);                             // DELETE npcs/12/photos/3.json
await client.game('epic-quest').factions.uploadPhoto(5, new File([buffer], 'crest.png'));
```

| Family | `uploadPhoto(id, file)` | `setMainPhoto(id, photoId)` | `deletePhoto(id, photoId)` |
|---|---|---|---|
| `npcs`, `pcs` | yes | yes | yes |
| `documents` | yes | yes | — |
| `factions`, `items` | yes (single photo, replaced in place) | — | — |

- `uploadPhoto` runs both steps in one call: `POST <id>/photo_upload.json` returns an upload id
  and an upload token, then the file is sent as `multipart/form-data` (field `file`) to
  `POST /uploads/image/<upload_id>/submit` with the token in `X-Upload-Token`. It returns the
  submit body, `{ file_path }`.
- `file` is a `Blob` / `File`, or a `Buffer` / `Uint8Array` with a required `filename` option
  (and an optional `contentType`); anything else throws `UsageError` before any request.
- The submit step has a 120 s timeout by default, overridable with `{ timeout }`; the first step
  keeps the configured timeout.
- No photo action has a restricted variant (`{ restricted: true }` throws `UsageError`), and none
  is retried. A rejected upload answers `422` (`{"error": "Unprocessable Entity", "reason":
  "<code>"}`), raised as an `ApiError` whose `codes` include the reason. Neither token ever
  appears in an error.
- Scopes: an upload needs `write` on its family (`npcs:write` for an NPC photo). Until #1639
  lands, the submit step refuses scoped tokens with `403 token_not_allowed` (faction photos
  until #1639 covers them too).

### Raw requests

For anything the wrappers do not cover yet, requests can go through `client.http` and
`client.paginator`. Paths are relative to `baseUrl` and given without the `.json` suffix:

```js
const { body } = await client.http.get('games/epic-quest/npcs/12');
await client.http.patch('games/epic-quest/npcs/12', { name: 'Robert' });
```

Every request carries `Authorization: Bearer <token>`. Bodies are sent as JSON, or as
`multipart/form-data` when a native `FormData` is given. `{ json: false }` sends the request to
`<baseUrl>/<path>` without the `.json` suffix (as the upload submit does).

### Pagination

```js
const page = await client.game('epic-quest').npcs.list({
  page: 2, perPage: 50, query: { name: 'Bob' },
});
page.data;    // array of plain objects
page.page;    // 2
page.pages;   // 7
page.perPage; // 50
page.total;   // 330
page.hasNext; // true
await page.next(); // the next Page, or null on the last one

for await (const npc of client.game('epic-quest').npcs.iterate({ query: { slain: false } })) {
  // one page fetched at a time, on demand
}
```

- Filters go in `query`; they cannot override `page` / `per_page`.
- `perPage` is sent only when given; otherwise the server default applies.
- `client.paginator.list(path, options)` / `client.paginator.iterate(path, options)` do the
  same on a raw path.
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
  await client.game('epic-quest').npcs.list({ restricted: true });
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

## CLI

The package ships a thin `majora` command-line tool on top of the library, for quick
scripting and debugging. It adds no logic of its own: every command maps onto one library
call, and it prints JSON only.

### Install

```sh
npx majora-client --help        # run without installing
npm install -g majora-client    # or install the `majora` executable globally
majora --help
```

### Configuration

| Source | Meaning |
|---|---|
| `MAJORA_URL` | The API root, e.g. `https://majora.example.com`. Overridden by `--url <url>`. |
| `MAJORA_TOKEN` | The scoped API token (`mjr_...`). Overridden by `--token-file <path>` (whitespace trimmed). |
| `MAJORA_GAME` | The default game for game-scoped resources. Overridden by `--game <slug>`. |

- There is **no `--token` flag**: a token on the command line ends up in shell history and in
  `ps` output. Use `MAJORA_TOKEN` or `--token-file`.
- HTTPS only, as in the library: plain `http://` needs `--allow-insecure-http` (except for
  `localhost` / `127.0.0.1`).
- The token is never printed: not on stdout, stderr, `--debug` or `--help`.

### Commands

`majora <resource> <action> [<id>] [flags]`:

```sh
majora games mine
majora npcs list --game epic-quest
majora npcs get 12 --game epic-quest --restricted
majora games get epic-quest
majora npcs create --game epic-quest --data '{"name": "Bob"}'
majora npcs update 12 --game epic-quest --data @npc.json
```

| Resource | Actions | Game-scoped |
|---|---|---|
| `games` | `list`, `mine`, `get <slug>` | no (`--game` is ignored) |
| `npcs` | `list`, `get <id>`, `create`, `update <id>` | yes |
| `pcs` | `list`, `get <id>`, `update <id>` (no `create`) | yes |
| `factions` | `list`, `get <id>`, `create`, `update <id>` | yes |
| `items` | `list`, `get <id>`, `create`, `update <id>` | yes |
| `documents` | `list`, `get <id>`, `create`, `update <id>` | yes |

A game-scoped command needs `--game <slug>` or `MAJORA_GAME`. `majora --help`,
`majora <resource> --help` and `majora --version` print the help and the package version.
Document pages, links and photo uploads have no CLI command yet, and there is no raw request
command.

### Flags

| Flag | Meaning |
|---|---|
| `--url <url>` | Overrides `MAJORA_URL`. |
| `--token-file <path>` | Reads the token from a file (whitespace trimmed). Overrides `MAJORA_TOKEN`. |
| `--allow-insecure-http` | Passes `allowInsecureHttp: true`. |
| `--game <slug>` | The game for game-scoped resources (falls back to `MAJORA_GAME`). |
| `--restricted` | Uses the restricted variant (`all.json` / `full.json`). |
| `--page <n>`, `--per-page <n>` | One page of a `list` (positive integers). |
| `--all` | Streams every page (NDJSON). Cannot be combined with `--page`. |
| `--meta` | `list` prints the page metadata together with `data`. |
| `--query <key>=<value>` | Repeatable. Builds the library's `query` filter object (split on the first `=`). |
| `--data <json \| @file \| ->` | The body for `create` / `update`: inline JSON, a file, or stdin (curl convention). It must be a JSON object. |
| `--timeout <ms>`, `--retries <n>` | Passed through to the library. |
| `--debug` | Prints stack traces on error. Never prints request headers. |
| `--help`, `--version` | Prints the help text or the package version. |

### Output

- stdout gets JSON only, pretty-printed with 2 spaces.
- `get`, `create`, `update` (and `games mine`) print the returned object.
- `list` prints the page's `data` array (`[]` when empty); with `--meta` it prints
  `{ data, page, pages, perPage, total }`.
- `list --all` streams every item as NDJSON (one compact JSON object per line), one page at a
  time; an empty list prints nothing.
- A closed pipe (for example `| head`) stops quietly with exit code 0; Ctrl-C during a request
  or `--all` aborts the in-flight request and exits 130.

```sh
majora npcs list --game epic-quest --all | jq -r '.name'
majora npcs list --game epic-quest --meta | jq '.total'
```

### Exit codes and errors

Errors go to stderr as one line with the error message; a `ValidationError` adds its `fields`
object on the next line. Stack traces only with `--debug`.

| Code | Cause |
|---|---|
| 0 | Success |
| 1 | Unexpected / internal error |
| 2 | Usage error: bad arguments, `UsageError`, `ConfigurationError`, invalid `--data` |
| 3 | `AuthenticationError` (401) |
| 4 | `PermissionError` (403) |
| 5 | `NotFoundError` (404) |
| 6 | `ValidationError` (400) |
| 7 | Other `ApiError` (409, 422, ...) |
| 8 | `ServerError` (5xx) |
| 9 | `NetworkError`, including timeouts |
| 130 | Interrupted (SIGINT) |

Usage errors (exit 2) include an unknown resource or action, an action the resource does not
have (`pcs create`), a missing `<id>`, `--data` on a read or missing on a write, `--all` with
`--page`, `--restricted` on a family without that variant, and `--data` that is not a valid JSON
object. The command grammar, flags, exit codes and JSON output are part of the package's semver
contract.

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

- [Client guide](../docs/guides/client.md): creating a scoped API token and using it with this
  package.
- [Client agent docs](../docs/agents/client.md): design and internals of the library, the CLI
  and the packaging.

## License

MIT
