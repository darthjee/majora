# Interactive per-collection Enqueue (Lootstudios crawler)

Design spec for #1291: an interactive alternative to the headless
whole-catalog crawler run (`npx navi-hey --config crawler/navi_config.yaml`,
#1263). A Navi *extension* — a backend route plus a frontend page, baked
into a derived `darthjee/navi-hey` image — lets a maintainer paste one
Lootstudios collection (bundle) URL and click "Enqueue" to crawl just that
collection: extract its bundle and miniatures from `GetMyLootsCache`
(`collection-to-stl-models.md`, Approach A) and emit them to Majora via
`POST /miniatures/collections/import.json` (#1281) and
`POST /miniatures/stl_models/import.json` (#1262). The headless run stays
byte-identical and primary; this mode is additive, local-maintainer-run,
and **never deployed**.

This page is the **contract** the other #1291 sub-issues build against:
#1294 (web-enabled Navi config), #1295 (extension backend route), #1296
(extension frontend page). It is **temporary** — per `docs/agents/specs.md`,
it is removed once #1291 is fully implemented.

> **Pending removal.** #1291 is now fully implemented (#1292–#1299 have all
> landed) — this page's contract has been built exactly as specified.
> Removing it (and its listing in
> [`loot-crawling.md`](../loot-crawling.md)) is deferred to a later cleanup
> pass rather than done as part of #1300, so it still exists for now; treat
> it as historical/contract documentation rather than a live design
> question.
>
> This page is complementary to
> [`crawler-test-harness.md`](../crawler-test-harness.md): this one is an
> on-demand *input* UI (crawl one collection into Majora), the other is an
> *output*-side debug harness (inspect what a crawler run emitted).

## Enqueue mechanism

Navi's `POST /api/engine/start` does support a genuine runtime-parameterized
enqueue (`targets[].parameters` / `resources[].parameters`, substituted into
a resource's `{:token}` placeholders — see "Note on Navi's parameterized
enqueue" below). That mechanism only reaches a resource's request `url`,
its `emit.url`, and the `parameters.*` expression namespace consumed by
chained `actions`/`paginated_actions`. It does **not** reach
`parser.filter.equals` — filter conditions stay a build-time literal with
no `{:token}` substitution. Since `GetMyLootsCache` always returns the
*entire* catalog (no per-slug query parameter — `source-to-collections.md`),
narrowing the response down to one collection only happens through
`parser.filter`, which the runtime-parameterized-enqueue feature cannot
touch. So it cannot enqueue "this one collection" on its own, and the
mechanism this spec adopts instead is:

1. **Resolve the slug up front.** Before touching Navi, the extension
   backend handler itself issues one plain `GET
   /wp-admin/admin-ajax.php?action=GetMyLootsCache` against
   `app.lootstudios.com` (same browser-like headers as
   `crawler/navi_config.yaml`'s `lootstudios` client — see
   `emission-endpoint.md`'s "Request pacing/headers" note, otherwise this
   direct call gets the same flat `403`), and finds the `obj_type: "bundle"`
   record whose `obj_slug` matches the input slug
   (`collection-to-stl-models.md`'s Approach A, step 2). If no match is
   found, the Enqueue fails fast (see "Route contract" below) — nothing is
   ever pushed to Navi for an unknown collection. This resolve call also
   yields the bundle's `obj_inid`, needed for the miniature-pass filter in
   step 2.
2. **Build and push a per-collection resource.** With the concrete
   `obj_slug`/`obj_inid` in hand, the handler builds a two-pass Navi
   resource — the same bundle-pass/miniature-pass shape
   `crawler/navi_config.yaml`'s `loot_catalog` resource already uses, just
   with each pass's `filter` narrowed to that one collection instead of
   `equals: bundle` / `equals: miniature` alone (see "Per-collection
   resource shape" below) — and `POST /api/config`s it under a fresh,
   per-enqueue namespace (see "Namespace / resource identity").
3. **Start it.** The handler then calls `POST /api/engine/start` scoped to
   that namespace (`{ "targets": [{ "namespace": "<name>", "resources":
   ["enqueue"] }] }`). Per Navi's web server (`### /engine/start request and
   response`), this starts the engine if it is `stopped` or pushes the
   resource into an already-`running` engine — the same call covers both
   the first-ever Enqueue and every one after it, with no special-casing.
4. **Done** means the pushed resource's job(s) drain out of Navi's worker
   queue (visible via `GET /stats.json` / `GET /jobs/:status.json`) and its
   `emit` calls succeed (`GET /emissions.json` — `status: "success"`),
   after which the `Collection` and its `StlModel`s exist in Majora. This
   spec does not require the extension page to poll for that (see
   "Deferred / out of scope").

Both the handler's own resolve call (step 1) and the engine calls it issues
against itself (steps 2–3) are plain HTTP requests — the extension module
contract (`import { RequestHandler } from 'navi-hey/extension'`) only gives
handler code `req`/`res`, no access to Navi's internal engine/registry
objects, so calling back into the same process's own `/api/*` routes over
loopback HTTP (e.g. via `navi-hey-client`'s `NaviClient`, already used
elsewhere in this project — see `docs/agents/external/HOW_TO_USE_NAVI-CLIENT.md`)
is the only available integration point, not a shortcut.

### Note on Navi's parameterized enqueue

Navi's node client documents a real parameterized-enqueue feature
(`docs/agents/external/navi-client/samples/parameterized-enqueue.md`,
`reference.md`): `POST /api/engine/start`'s `targets[].resources[]` entries
may be `{ "name": "<resource>", "parameters": {...} }` instead of a bare
string, substituting `{:token}` values into that resource's `url`/`emit.url`
at call time, with no `POST /api/config` push needed. Upstream
`darthjee/navi#828`, which shipped this, is **closed/merged** — not merely
proposed. It is not used here because its substitution surface is
explicitly limited to `url`, `emit.url`, and the `parameters.*` expression
namespace for chained `actions`/`paginated_actions` — never
`parser.filter.equals` or `emit.body_template` (which resolves against the
extracted item, not request parameters). This Enqueue's whole job is
filtering `GetMyLootsCache`'s response down to one collection, which is a
`filter` concern, so the feature doesn't help here. It would help a
*future* redesign where the request itself is scoped per-collection (e.g.
if Lootstudios ever exposed a per-bundle endpoint) — noted for completeness
in case a later maintainer wonders why this spec doesn't use it.

## Namespace / resource identity

Every Enqueue call pushes its resource under a **fresh, unique-per-call**
namespace, so two collections enqueued concurrently — or the same
collection re-enqueued while an earlier run is still in flight — never
clobber each other's still-queued/running pushed definition:

```text
enqueue_<slug>_<discriminator>
```

- `<slug>` — the resolved bundle's `obj_slug` (already URL-safe:
  lowercase, hyphen-separated, e.g. `tidal-aberrations`).
- `<discriminator>` — a fresh UUID v4 (e.g. Node's `crypto.randomUUID()`)
  minted by the handler for this one call. A slug alone is not enough:
  two rapid enqueues of the *same* collection must still get distinct
  namespaces, since the first may still be queued/running when the second
  arrives.

Within that namespace, the pushed resource is always named `enqueue` (the
namespace itself already guarantees uniqueness, so the resource name
doesn't need to). `POST /api/engine/start` is then scoped to
`{ "resources": ["enqueue"] }` in that namespace — no `parameters` needed,
since every value is already baked into the pushed resource literally.

**Client references.** The pushed resource's two passes reference the
`lootstudios` and `majora_api` clients **by bare name** (`client:
lootstudios`, `emit.client: majora_api`) — it does **not** re-declare their
`base_url`/`headers`. Per Navi's cross-namespace reference rule
(`docs/agents/external/navi/splitting-configuration.md`, "Cross-namespace
references"): a bare, unqualified `client:`/`emit.client:` reference is
looked up first in the resource's *own* namespace, then falls back to the
`default` namespace if not found there. Since `POST /api/config` reuses the
same `NamespaceMap`/`NamespaceMapBuilder` machinery boot-time config
loading uses, this fallback applies to a runtime-pushed namespace exactly
as it does to a file-included one. This resolves the merge-semantics
question this spec was pinned to settle: **#1294's web config must load
the `lootstudios`/`majora_api` clients into the (implicit) `default`
namespace** (i.e. its entry file must not declare a `namespace:` key), so
every per-enqueue namespace's bare client references resolve there without
ever having to re-supply `base_url`/session-cookie/API-token values on each
push.

**Idempotency.** Re-enqueuing the same collection just mints another fresh
namespace and runs the same two-pass extraction again — Majora's own
upsert-by-`external_id` semantics (`model-changes.md`, `emission-endpoint.md`)
make the *net effect* idempotent (existing rows updated, never duplicated),
even though each attempt leaves its own namespace registered in Navi's
in-memory config for the lifetime of the process. Namespaces are never
cleaned up after their one job finishes; this is an accepted, documented
limitation given the tool is local-maintainer-run and short-lived (a
container restart clears everything), not a deployed, long-running service
where unbounded namespace growth would matter.

## Per-collection resource shape

Same bundle-pass/miniature-pass structure as `crawler/navi_config.yaml`'s
`loot_catalog` resource, with each pass's `filter` narrowed to the one
resolved collection instead of every bundle/miniature in the catalog:

```yaml
namespace: enqueue_tidal-aberrations_3f9c6d2e-...
resources:
  enqueue:
    # Bundle pass -> Collection
    - url: /wp-admin/admin-ajax.php?action=GetMyLootsCache
      status: 200
      client: lootstudios
      parser:
        type: json_path
        match: bundleObjs
        filter:
          - field: obj_type
            equals: bundle
          - field: obj_slug
            equals: tidal-aberrations
        fields:
          obj_inid: external_id
          obj_title: name
          obj_slug: slug
      emit:
        client: majora_api
        method: POST
        url: /miniatures/collections/import.json
        status: 200
        body_template:
          name: "{:name}"
          external_id: "{:external_id}"
          url: "https://app.lootstudios.com/bundle/{:slug}/"
          source_name: Lootstudios

    # Miniature pass -> StlModels, scoped to the same bundle via its
    # resolved obj_inid (F2608S14E02 in this worked example).
    - url: /wp-admin/admin-ajax.php?action=GetMyLootsCache
      status: 200
      client: lootstudios
      parser:
        type: json_path
        match: bundleObjs
        filter:
          - field: obj_type
            equals: miniature
          - field: bnd_inid
            equals: F2608S14E02
        fields:
          obj_inid: external_id
          obj_title: name
          bnd_inid: collection_external_id
      emit:
        client: majora_api
        method: POST
        url: /miniatures/stl_models/import.json
        status: 200
        body_template:
          name: "{:name}"
          external_id: "{:external_id}"
          source_name: Lootstudios
          collection_external_id: "{:collection_external_id}"
```

`clients:` is omitted from the pushed payload entirely — see "Client
references" above. Both passes still call the shared `GetMyLootsCache`
endpoint independently (one Navi request each), matching the headless
config's existing two-pass shape rather than introducing a join step; the
per-collection `filter` narrowing is the only difference from
`crawler/navi_config.yaml`.

## Concurrency

Each Enqueue becomes real jobs in Navi's worker pool (two `GET
GetMyLootsCache` requests plus one `emit` per extracted item), so
concurrent Enqueues run in parallel, bounded only by `workers.quantity`.
Nothing in this design serializes enqueues on top of Navi's own scheduling.
#1294's web config should set `workers.quantity` to at least `2` — this is
a local, single-maintainer tool with a handful of Enqueue clicks expected
at once (not a high-throughput service), so a small pool (e.g. `4`) is
sufficient; #1294 may tune the exact value.

## Route contract

`POST /ext/lootstudios/enqueue.json` — public (see "Security posture"),
consumed by #1296's frontend page and implemented by #1295.

**Request body:**

```json
{ "url": "https://app.lootstudios.com/bundle/tidal-aberrations/" }
```

`url` is required and must match
`^https?:\/\/app\.lootstudios\.com\/bundle\/([a-z0-9-]+)\/?(\?.*)?$`
(case-insensitive scheme); the handler derives the slug from the first
capture group. Any other shape (missing `url`, wrong host/path, a bare
slug string, etc.) is rejected before any network call is made.

**Responses:**

| Case | Status | Body |
| --- | --- | --- |
| Accepted | `200` | `{ "status": "enqueued", "slug": "tidal-aberrations", "namespace": "enqueue_tidal-aberrations_<uuid>" }` |
| Malformed `url` | `400` | `{ "error": "url must be an https://app.lootstudios.com/bundle/<slug>/ URL" }` |
| Slug not found in the catalog | `404` | `{ "error": "collection not found" }` |
| The `GetMyLootsCache` resolve call, `POST /api/config`, or `POST /api/engine/start` call fails | `502` | `{ "error": "<underlying failure message>" }` |

"Accepted" only confirms the job was queued (Navi's `POST
/api/engine/start` returned `enqueued: ["enqueue"]` with no matching entry
in `skippedResources`) — it is not a guarantee the crawl/emission itself
will succeed; see "Deferred / out of scope" for why this page carries no
live run-status.

## Engine lifecycle & config

`web.autostart: false` in #1294's web config — the derived image boots
with the web server up but the engine `stopped`, no jobs enqueued, until
the first Enqueue call. Every Enqueue's `POST /api/engine/start` (step 3
above) works identically whether the engine is still `stopped` (first
call) or already `running` (every call after) — this is Navi's documented
`autostart: false` behavior (Navi's own `web-server.md`, `Configuration`
section: "the application boots with the web server running but the
engine `stopped` ... until `PATCH /engine/start` is called"; the
token-secured `POST /api/engine/start` this spec uses shares that same
lifecycle).

`web.api.token` secures every `/api/*` route the handler calls (`POST
/api/config`, `POST /api/engine/start`). #1294's web config sets it from
an env var, `NAVI_API_TOKEN` (matching the name `navi-client`'s own samples
use) — #1298 owns the concrete compose wiring that supplies its value to
the derived image's container.

## Security posture

Per Navi's route-extension design, extension backend routes are
**public — there is no token wiring in v1** regardless of `web.api.token`
(that only secures Navi's own stock `/api/*` routes, which the extension
handler calls *from inside* the same process, not routes it exposes). The
enqueued crawl's `emit` calls carry the container's own staff/admin
`MAJORA_API_TOKEN` via the `majora_api` client's `Authorization: Token
$MAJORA_API_TOKEN` header (same as the headless `crawler/navi_config.yaml`
today). Mitigation: this image is **local-maintainer-run only, never
deployed**, with its port bound to `127.0.0.1` in whatever compose wiring
#1298 adds — never exposed on a public interface. No auth layer is added
to the extension route itself.

## Extraction

Extraction is `collection-to-stl-models.md`'s Approach A
(`GetMyLootsCache`, filtered by `obj_slug`/`bnd_inid`) — this page only
adds the "resolve once, then filter to one collection" wrapper described
above. Emission payloads follow `emission-endpoint.md`'s field mapping and
example bodies exactly, including its "Standalone Collection import"
section covering `POST /miniatures/collections/import.json` (#1281, used
by the bundle pass above).

## Deferred / out of scope

- The `201`-on-create vs. `emit.status: 200` mismatch between what
  `POST /miniatures/collections/import.json` / `stl_models/import.json`
  may actually return and what Navi's `emit.status` config expects is
  fixed by #1297; this spec's `emit.status: 200` examples above match
  today's `crawler/navi_config.yaml` and will need the same fix #1297
  applies there.
- No live run-status UI. #1296's page is form-only: submit a URL, show the
  `200`/`400`/`404`/`502` response from "Route contract" above, nothing
  more. Watching a run drain (`GET /stats.json`, `GET /jobs/:status.json`,
  `GET /emissions.json`) is not part of #1291.
- No deployment. This image and route are for local maintainer use only
  (see "Security posture").

## Acceptance criteria

For #1291 as a whole:

- Enqueuing a real, owned bundle URL results in exactly one Navi job graph
  running to completion with no entries reaching `dead` status.
- The corresponding `Collection` and its `StlModel`s appear via Majora's
  miniatures API (`docs/guides/majora/miniatures.md`) after that run
  finishes.
- Re-enqueuing the same collection updates the existing `Collection`/
  `StlModel` rows (matched by `external_id`) rather than duplicating them.
- The existing headless whole-catalog run
  (`npx navi-hey --config crawler/navi_config.yaml`) is unaffected —
  byte-identical config and behavior.
