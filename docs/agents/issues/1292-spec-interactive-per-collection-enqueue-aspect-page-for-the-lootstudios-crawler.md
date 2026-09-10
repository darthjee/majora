# Issue: Spec: interactive per-collection Enqueue aspect page for the Lootstudios crawler

## Description

Part of #1291, which gives the Lootstudios crawler an interactive per-collection
"Enqueue" interface: a Navi extension (backend route + frontend page) baked into a
derived `darthjee/navi-hey` image. A page takes one Lootstudios collection URL;
an "Enqueue" button fires a real Navi queue job that crawls just that collection
(extract STL models, emit to Majora via `POST /miniatures/collections/import.json`
#1281 and `POST /miniatures/stl_models/import.json` #1262). The existing headless
whole-catalog run (`npx navi-hey --config crawler/navi_config.yaml`) stays
byte-identical and primary; the new mode is additive and local-maintainer-run
(never deployed).

This issue produces the **design spec** the other #1291 sub-issues build against.
It is the blocking sub-issue and must land first. Deliverable: a temporary aspect
page at `docs/agents/specs/loot-crawling/interactive-collection-enqueue.md`,
linked from the "## Aspect pages" list in
`docs/agents/specs/loot-crawling.md`. Per `docs/agents/specs.md` it is removed
once #1291 is fully implemented (#1300).

## Problem

The other #1291 sub-issues — #1294 (web-enabled Navi config), #1295 (extension
backend route), #1296 (extension frontend page) — each need a fixed contract to
build against independently: the exact enqueue HTTP endpoint, its request/response
JSON, the per-request Navi resource shape, the engine lifecycle, and the security
posture. Without a written spec they would each re-invent these and drift.

One key uncertainty is now resolved (investigated against Navi's upstream
`docs/agents/web-server.md`, absent from this repo): **Navi has no mechanism to
enqueue a named resource with per-request parameters at runtime.**
`POST /api/engine/start` and `PATCH /engine/start` accept resource *names* only.
The only way to introduce a collection-specific URL is `POST /api/config`, which
merges a whole resource/client definition into a namespace and stores it
literally (no `$VAR` resolution). So the mechanism is fixed: the extension
backend handler builds a full per-collection resource (concrete slug/URL baked
into the `url` templates), `POST /api/config`s it, then starts it.

Because each Enqueue becomes a real job in Navi's worker pool, multiple enqueues
run **in parallel**. Two in-flight collections must therefore never share a
pushed Navi namespace/resource name, or the second `POST /api/config` would
clobber the first while it is still queued or running. The identity strategy that
avoids this is part of this spec (see Solution), not left to #1295.

## Solution

Write `docs/agents/specs/loot-crawling/interactive-collection-enqueue.md`
covering:

- **Enqueue mechanism** — the `POST /api/config` (per-collection resource with
  the concrete slug/URL) followed by engine start
  (`POST /api/engine/start` scoped via `targets`, or `PATCH /engine/start`)
  flow, in enough detail for #1295 to implement with no design latitude.
- **Namespace / resource identity (pinned here, not deferred)** — the spec
  defines exactly how each Enqueue names the namespace/resource it pushes, keyed
  so that concurrent enqueues never collide (unique per enqueue, e.g. derived
  from the collection slug plus a per-call discriminator). Covers: whether the
  pushed resource references the `lootstudios` / `majora_api` clients already
  loaded from `navi_config.web.yaml` or re-pushes concrete client definitions
  (given `/api/config` does no env-var resolution); idempotency / behaviour of
  re-enqueuing the same collection; and the engine-start call each Enqueue
  issues against its own namespace (engine boots paused via
  `web.autostart: false` and stays up as enqueues arrive).
- **Concurrency** — enqueues are processed in parallel by Navi's worker pool; the
  spec states the expected `workers.quantity` for the web config and that no
  serialization is imposed on top of Navi.
- **Route contract** — the `POST /ext/…/enqueue.json` path, the request body
  (the collection URL / slug and its validation rules), and the response shape
  for success and error. Consumed by #1295 and #1296.
- **Engine lifecycle** — `web.autostart: false` (boot paused) and how/where
  `web.api.token` is supplied; name the env var.
- **Security posture** — Navi extension backend routes are public (no token
  wiring); the enqueued work carries the container's staff/admin
  `MAJORA_API_TOKEN`. Mitigation: local-maintainer-run only, not deployed, port
  bound to localhost. No auth layer is added.
- **Extraction** — reference
  `docs/agents/specs/loot-crawling/collection-to-stl-models.md` (Approach A:
  filter `GetMyLootsCache` by `obj_slug`); do not re-derive it. Do not repeat
  `docs/agents/specs/loot-crawling/emission-endpoint.md`'s stale "only emission
  target" / "no standalone Collection-creation call" claims — #1281 added the
  standalone endpoint; #1300 patches the stale page.
- **Upstream follow-up** — cross-reference `darthjee/navi#828` (proposes a real
  parameterized runtime enqueue). The `POST /api/config` approach above is the
  interim workaround; `navi#828` landing would simplify #1295 later but does not
  block #1291.
- **Deferred** — the 201-on-create vs `emit.status: 200` mismatch is fixed in
  #1297; note it only.
- **Acceptance criteria** for the #1291 feature as a whole.

## Benefits

- #1294, #1295, and #1296 can proceed in parallel against a stable contract
  instead of blocking on each other.
- The one real unknown — whether Navi supports parameterized enqueue — is settled
  before implementation rather than discovered mid-#1295, and the "do it
  properly" path is captured upstream as `darthjee/navi#828`.
- Pinning the namespace/resource identity in the spec keeps concurrent enqueues
  safe by construction rather than relying on #1295 to get it right.
- The temporary spec keeps `docs/agents/specs/loot-crawling/` the single source
  of truth for the crawler design, consistent with how #1262 / #1281 were
  specced.
