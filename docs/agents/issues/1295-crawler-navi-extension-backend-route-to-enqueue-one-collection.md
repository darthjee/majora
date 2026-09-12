# Issue: Crawler: Navi extension backend route to enqueue one collection

## Description

Part of #1291 ("Interactive per-collection Enqueue interface for the
Lootstudios crawler"). The Lootstudios crawler is a Navi config
(`crawler/navi_config.yaml`) run headless via `npx navi-hey` that imports the
whole `GetMyLootsCache` catalog into Majora via
`POST /miniatures/collections/import.json` (#1281) and
`POST /miniatures/stl_models/import.json` (#1262). #1291 adds an interactive
alternative: a Navi extension page with a collection-URL input + "Enqueue"
button that fires a real Navi queue job to crawl one collection. The headless
whole-catalog run stays byte-identical and primary; the new mode is additive
and local-maintainer-run.

Building on #1292's now-landed spec
(`docs/agents/specs/loot-crawling/interactive-collection-enqueue.md`),
#1293's scaffold (`crawler/navi-extension/`, which already proves the
`RequestHandler` wiring via `src/backend/hello.js`), and #1294's web-enabled
entry config (`crawler/navi_config.web.yaml`), this issue adds the real
`src/backend/enqueue.js` handler — the piece of #1291 that actually resolves
a collection and pushes a real Navi job for it. #1296's frontend page is the
only remaining consumer, calling this route directly.

This issue's scope is more concrete than the original split draft now that
#1292's spec has landed: the route path, request/response contract, resource
shape, and namespace scheme are no longer open questions deferred to "SUB-1" —
they're spelled out below straight from the spec.

## Expected Behavior

- `POST /ext/lootstudios/enqueue.json` with
  `{"url": "https://app.lootstudios.com/bundle/<slug>/"}` for a real, owned
  bundle returns `200`
  `{"status": "enqueued", "slug": "<slug>", "namespace": "enqueue_<slug>_<uuid>"}`
  and actually starts a real Navi job: the pushed `enqueue` resource's
  bundle/miniature passes drain out of the worker queue and their `emit`
  calls succeed (verified end-to-end in #1298's manual check, not by this
  issue's own unit spec).
- A malformed `url` (missing, wrong host/path, a bare slug) is rejected
  before any network call: `400`
  `{"error": "url must be an https://app.lootstudios.com/bundle/<slug>/ URL"}`.
- A syntactically valid URL whose slug isn't found in the live
  `GetMyLootsCache` catalog: `404` `{"error": "collection not found"}`.
- A failure in the handler's own resolve call, `POST /api/config`, or
  `POST /api/engine/start`: `502` `{"error": "<underlying failure message>"}`.
- The existing headless whole-catalog run
  (`npx navi-hey --config crawler/navi_config.yaml`) is unaffected.

## Solution

Add `crawler/navi-extension/src/backend/enqueue.js` — a `RequestHandler`
subclass (`import { RequestHandler } from 'navi-hey/extension'`, matching
#1293's `hello.js` pattern) registered at `POST /ext/lootstudios/enqueue.json`
(the spec's "Route contract" — not `/ext/loot/collections/enqueue.json` as
the original split draft guessed before the spec landed):

1. **Validate.** Match the body's `url` against
   `^https?:\/\/app\.lootstudios\.com\/bundle\/([a-z0-9-]+)\/?(\?.*)?$`;
   reject anything else with the `400` above before any network call.
2. **Resolve the slug.** Issue one direct
   `GET /wp-admin/admin-ajax.php?action=GetMyLootsCache` against
   `app.lootstudios.com` — the same browser-like headers
   `crawler/navi_config.yaml`'s `lootstudios` client uses (`User-Agent`/
   `Accept`/`Accept-Language` literals plus
   `Cookie: PHPSESSID=$LOOTSTUDIOS_SESSION_COOKIE`) — and find the
   `obj_type: "bundle"` record whose `obj_slug` matches. No match -> the
   `404` above. This is the handler's **one** direct extraction call (needed
   to get the concrete `obj_inid` for the pushed resource's miniature-pass
   filter); it is not a Majora emission and doesn't touch
   `stl_models`/`collections` — the actual crawl still happens as pushed
   Navi jobs, never inline in the handler.
3. **Build the per-collection resource** — synthesized entirely in the
   handler; there is no template file to fill in (#1294 confirmed the
   per-collection resource does **not** live in `navi_config.web.yaml`).
   Matches the spec's "Per-collection resource shape": the same
   bundle-pass/miniature-pass structure as `navi_config.yaml`'s
   `loot_catalog`, with each pass's `filter` narrowed to the resolved
   `obj_slug`/`obj_inid`. References the `lootstudios`/`majora_api` clients
   by bare name only (no `clients:` block in the pushed payload) — they
   resolve via #1294's implicit-`default`-namespace wiring.
4. **Mint the namespace** — `enqueue_<slug>_<uuid>` (`crypto.randomUUID()`),
   so concurrent/repeat enqueues of the same collection never clobber each
   other's still-queued push.
5. **Push and start.** `POST /api/config` (bearer = `NAVI_API_TOKEN`) pushes
   the resource into that namespace, then `POST /api/engine/start` scoped to
   `{"targets": [{"namespace": "<name>", "resources": ["enqueue"]}]}`; this
   one call covers both the first-ever Enqueue (engine `stopped`, per
   #1294's `autostart: false`) and every one after (engine already
   `running`). Both calls are loopback HTTP against the same process's own
   web server (port `3000`, per #1294) — the extension module contract
   gives handler code no direct access to Navi's internal engine/registry
   objects, so this is the only available integration point, not a
   shortcut.
6. Map failures from steps 2/5 to the `502` shape above; return the `200`
   confirmation shape once `/api/engine/start` reports the resource
   enqueued.

**Tests** — `crawler/navi-extension/tests/backend/enqueue_spec.js`, driving
the handler with a fake `req`/`res` and `AxiosUtils`-stubbed
(`navi-hey/testing/axios.js`) outbound calls, matching #1293's spec style.
Assert: the route's `method`/`path`; the pushed resource payload carries the
concrete slug/`obj_inid`/URL; `/api/engine/start` is called scoped to the
minted namespace; the `200` confirmation body on success; the `400`/`404`/
`502` error shapes for an invalid URL, an unresolvable slug, and a failed
outbound call respectively.

**Env vars.** Reads `LOOTSTUDIOS_SESSION_COOKIE` (its own resolve call's
`Cookie` header, step 2) and `NAVI_API_TOKEN` (bearer for its own
`/api/config`/`/api/engine/start` self-calls, step 5) from the container
environment. It does **not** need `MAJORA_API_TOKEN`/`MAJORA_API_BASE_URL`
directly — those stay on the `majora_api` client `navi_config.yaml` already
declares, resolved by Navi itself when it runs the pushed resource, not
re-supplied by the handler.

Navi extension backend routes are public — no token wiring on
`/ext/lootstudios/enqueue.json` itself; the security posture (local-only,
localhost-bound port) is #1298's concern, not enforced here (spec's
"Security posture").

Touches: `crawler/navi-extension/src/backend/enqueue.js` (new),
`crawler/navi-extension/tests/backend/enqueue_spec.js` (new), and
`crawler/navi-extension/package.json` — gains `navi-hey-client` as a real
runtime dependency (currently the project has none; `navi-hey/extension` is
free from the container image, but `navi-hey-client` is a separate published
package, not bundled the same way) for calling back into Navi's own
`/api/*` per the spec's "only available integration point". Whether the
direct Lootstudios resolve call in step 2 needs its own HTTP dependency too,
or reuses one already available from `navi-hey`'s own runtime, is left to
planning.

Owner: **crawler**. Depends on: #1292 (spec — landed), #1293 (scaffold —
landed), #1294 (web config — landed). Blocks: #1296 (frontend page), #1298
(infra manual verification), #1299 (test suite/CI job).

## Benefits

- #1296's frontend page has a real endpoint to call, unblocking the last
  piece of #1291's interactive path.
- The route contract, resource shape, and namespace scheme all come straight
  from #1292's landed spec — no design left to this issue, only faithful
  implementation.
- Keeps the "no inline emission" boundary intact: all Majora writes still
  flow through the pushed Navi resource's `emit`, never through a
  Majora-facing call in the handler itself.
