# Crawler Plan: Crawler: Navi extension backend route to enqueue one collection

Main plan: [plan.md](plan.md)

## Overview

Implement `crawler/navi-extension/src/backend/enqueue.js`, the one backend
piece of #1291 ("Interactive per-collection Enqueue interface for the
Lootstudios crawler") that actually crawls a single collection on demand.
Everything it needs is already pinned by #1292's landed spec
(`docs/agents/specs/loot-crawling/interactive-collection-enqueue.md`) and the
scaffold/config #1293/#1294 already landed — this is faithful implementation,
no open design.

## Context

- `crawler/navi-extension/src/backend/hello.js` is the only existing backend
  route so far — a `RequestHandler` subclass exported as
  `[{ method, path, handler }]`, using `this.response.json(payload)`.
  `docs/agents/external/navi/extending-navi.md` confirms the response object
  is Express-like: "the handler owns the response — it calls `res.json(...)`
  / `res.status(...)` / `res.send(...)` itself" — so error responses are
  `this.response.status(400).json({ error: '...' })`, etc.
- `crawler/navi-extension/package.json` currently declares **zero runtime
  dependencies** (only `vite`/React devDependencies for the frontend build).
  `navi-hey/extension` (and the testing doubles under `navi-hey/testing/*`)
  resolve for free inside the `darthjee/navi-hey`/`darthjee/navi-hey-test`
  images without a package.json entry — but `navi-hey-client` is a
  **separate published package**, not bundled that way, so it must be added
  as an explicit dependency (per the issue's confirmed answer).
  `docs/agents/external/navi/extending-navi.md` documents
  `navi-hey/testing/axios.js`'s `AxiosUtils` as stubbing "outbound `axios`
  calls a handler makes" — this, plus `navi-hey`'s own use of `axios`
  internally for resource fetching, strongly suggests `axios` itself
  resolves the same free way `navi-hey/extension` does (no separate
  dependency needed for it); confirm this while implementing — if a plain
  `import axios from 'axios'` fails to resolve inside
  `docker compose run --rm extension_tests`, add `axios` to package.json's
  dependencies too.
- `docs/agents/external/navi-client/library-usage.md` / `reference.md` give
  the exact `NaviClient` API:
  ```js
  import { NaviClient } from 'navi-hey-client';
  const client = new NaviClient({ baseUrl: 'http://localhost:3000', token: process.env.NAVI_API_TOKEN });
  await client.config({ namespace, resources: { enqueue: [...] } }); // POST /api/config
  await client.engineStart({ targets: [{ namespace, resources: ['enqueue'] }] }); // POST /api/engine/start
  ```
  Both reject with an `ApiRequestFailed` error (`statusCode`, `url`, `body`)
  on failure or a `>= 400` response — this maps directly to the spec's `502`
  case. `baseUrl` is `http://localhost:3000` (port `3000`, per #1294's
  `web.port`); `token` is `process.env.NAVI_API_TOKEN`.
- `crawler/navi_config.yaml`'s `lootstudios` client's literal headers to
  replicate on the handler's own direct resolve call:
  ```
  User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36
  Accept: application/json, text/javascript, */*; q=0.01
  Accept-Language: en-US,en;q=0.9
  Cookie: PHPSESSID=<value of LOOTSTUDIOS_SESSION_COOKIE env var>
  ```
- The full route contract (request shape, all four response cases, the
  per-collection resource's exact two-pass structure, and the
  `enqueue_<slug>_<uuid>` namespace scheme) is spelled out in the issue file
  and, in full example form, in the spec's "Route contract" and
  "Per-collection resource shape" sections — read both before writing the
  handler rather than re-deriving them here.
- No other JS source exists anywhere else in this repo to borrow
  conventions from beyond `hello.js` and `navi-hey`'s own documented
  patterns (`frontend/` is a separate, unrelated React app) — this is
  otherwise greenfield Node code.

## Implementation Steps

### Step 1 — Add the enqueue handler

Create `crawler/navi-extension/src/backend/enqueue.js`, a `RequestHandler`
subclass (`import { RequestHandler } from 'navi-hey/extension'`) exported the
same way as `hello.js`:

```js
export default [
  { method: 'POST', path: '/ext/lootstudios/enqueue.json', handler: EnqueueHandler },
];
```

Inside `handle()` (or an async method it awaits — check whether `navi-hey`'s
`RequestHandler.handle()` is awaited by the runtime; mirror whatever
`hello.js`/the extension docs show, defaulting to an `async handle()` if
nothing says otherwise):

1. **Validate.** Read `this.request.body.url` (confirm the exact property
   `navi-hey` parses the JSON body into — check `extending-navi.md`/
   `hello.js` for how `request` exposes it; Express-style `req.body` is the
   default assumption). Match against
   `^https?:\/\/app\.lootstudios\.com\/bundle\/([a-z0-9-]+)\/?(\?.*)?$`
   (case-insensitive). No match ->
   `this.response.status(400).json({ error: 'url must be an https://app.lootstudios.com/bundle/<slug>/ URL' })`
   and return, before any network call.
2. **Resolve the slug.** `axios.get('https://app.lootstudios.com/wp-admin/admin-ajax.php?action=GetMyLootsCache', { headers: { ... } })`
   with the literal headers from Context above (`Cookie` built from
   `process.env.LOOTSTUDIOS_SESSION_COOKIE`). Parse the response for the
   `bundleObjs` array (same `json_path` shape `navi_config.yaml`'s
   `loot_catalog` resource parses) and find the `obj_type: "bundle"` entry
   whose `obj_slug` matches the captured slug. Not found ->
   `this.response.status(404).json({ error: 'collection not found' })`.
   Any request failure here -> the `502` shape (step 5).
3. **Build the per-collection resource** — a plain JS object matching the
   spec's "Per-collection resource shape" example exactly (bundle pass +
   miniature pass), with the resolved `obj_slug` templated into the bundle
   pass's `filter`/`url`/`body_template`, and the resolved `obj_inid`
   templated into the miniature pass's `filter`. Reference `client:
   lootstudios` / `emit.client: majora_api` by bare name — no `clients:` key
   in the payload.
4. **Mint the namespace** — `` `enqueue_${slug}_${crypto.randomUUID()}` ``
   (Node's built-in `crypto.randomUUID()`, no new dependency).
5. **Push and start** via a `NaviClient` instance (`baseUrl:
   'http://localhost:3000'`, `token: process.env.NAVI_API_TOKEN`):
   `await client.config({ namespace, resources: { enqueue: [...] } })` then
   `await client.engineStart({ targets: [{ namespace, resources: ['enqueue'] }] })`.
   Catch `ApiRequestFailed` (and the resolve call's own failures from step
   2) and respond
   `this.response.status(502).json({ error: err.message })` (or a
   comparably descriptive message built from `err.body`/`err.statusCode`
   when present).
6. On success:
   `this.response.status(200).json({ status: 'enqueued', slug, namespace })`.

Add `navi-hey-client` to `crawler/navi-extension/package.json`'s
`dependencies` (new key; `devDependencies` currently holds only the Vite/React
build deps). Add `axios` alongside it only if it turns out not to already
resolve inside the test/runtime image (see Context).

### Step 2 — Add the backend spec

Create `crawler/navi-extension/tests/backend/enqueue_spec.js`, following
`hello_spec.js`'s style (`navi-hey/testing/axios.js`'s `AxiosUtils` for
stubbing outbound calls, matching the imports table in
`extending-navi.md`). Cover:

- The route's `method`/`path` (`POST` / `/ext/lootstudios/enqueue.json`),
  same pattern as `hello_spec.js`'s first `it`.
- A valid URL: `AxiosUtils.stubGet` returns a fixture `bundleObjs` payload
  containing the matching bundle; assert the pushed `config` payload's
  bundle/miniature-pass `filter`s carry the concrete `obj_slug`/`obj_inid`,
  that `engineStart` is called scoped to the minted `enqueue_<slug>_...`
  namespace, and the `200 { status: 'enqueued', slug, namespace }` body.
- An invalid `url` (missing / wrong host / bare slug): assert the `400`
  error body and that no outbound call was made at all (`AxiosUtils`
  stub/spy not called).
- A slug not present in the stubbed `GetMyLootsCache` response: assert the
  `404` error body.
- A stubbed rejection on the resolve call and, separately, on the
  push/start calls (`AxiosUtils.stubGetRejection` /
  `.stubPostRejection`, per the imports table): assert the `502` error
  body in each case.

## Files to Change

- `crawler/navi-extension/src/backend/enqueue.js` — new `RequestHandler`
  implementing the route (Step 1).
- `crawler/navi-extension/package.json` — add `navi-hey-client` (and
  `axios`, if needed) as a dependency (Step 1).
- `crawler/navi-extension/tests/backend/enqueue_spec.js` — new Jasmine spec
  (Step 2).

## Notes

- Run the suite locally via `docker compose run --rm extension_tests`
  (`crawler/navi-extension/docker-compose.yml`) — there is no local Node
  toolchain to install; no CircleCI job exists yet for this folder (#1299
  adds `crawler_extension_tests`), so this isn't currently gated in CI.
- Confirm the exact request-body access pattern (`this.request.body` vs.
  something `navi-hey`-specific) and whether `handle()` may be `async`
  against `navi-hey`'s actual `RequestHandler` base class/docs before
  writing the handler — `hello.js`'s example is synchronous and reads
  nothing from the request, so it doesn't by itself confirm either point.
- Do not add any inline Majora emission call in the handler — all
  `POST /miniatures/*/import.json` traffic must stay inside the pushed Navi
  resource's own `emit`, never a direct call from `enqueue.js` (per the
  issue's "no inline emission" boundary).
- `MAJORA_API_TOKEN`/`MAJORA_API_BASE_URL` are **not** read by this handler
  — they stay on the `majora_api` client `navi_config.yaml` already
  declares, resolved by Navi itself when it runs the pushed resource.
