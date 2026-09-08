# Issue: Crawler — Navi configuration to extract and import Lootstudios models

## Description

Sub-issue of the parent tracking issue #1260 (Lootstudios STL Crawler).
`crawler/` (`docs/agents/crawler.md`) is currently a bare Node.js scaffold
with no crawling logic (issue #1148). [Navi](docs/agents/external/HOW_TO_USE_NAVI.md)
— already used elsewhere in this project as a cache-warmer — doubles as the
crawling engine: a resource's `parser:` block
([Extraction Configuration](docs/agents/external/navi/extraction-configuration.md))
extracts structured items from a response, and its `emit:` block
([Emit Configuration](docs/agents/external/navi/emit-configuration.md)) POSTs
each extracted item onward to another endpoint.

**Dependencies:**

- #1262 (backend crawler-import endpoint, `POST /miniatures/stl_models/import.json`)
  — **merged**. The exact request/response contract is documented at
  `docs/guides/majora/miniatures.md` and settled by the spec pages under
  `docs/agents/specs/loot-crawling/` (`source-to-collections.md`,
  `collection-to-stl-models.md`, `emission-endpoint.md`, `model-changes.md`).
- #1261 (Lootstudios API documentation) — still open, but its findings have
  already been written up as the spec pages above, which this issue builds
  against directly.
- **New: #1281** (backend — standalone `Collection` upsert endpoint,
  `POST /miniatures/collections/import.json`) — **blocking**. See "Why a
  second endpoint" below.
- **New: #1282** (verify `GetMyLootsCache` auth requirement + pagination,
  needs a live account) — non-blocking. This issue proceeds on the
  documented assumption (no auth strictly required, no pagination); #1282's
  findings may later require a correction here.

## Why a second endpoint (join limitation)

`emission-endpoint.md`'s original sketch assumed a "join" step would combine
each miniature record with its parent bundle record (both live in the same
`GetMyLootsCache` → `bundleObjs[]` array, distinguished by `obj_type`) to
populate `collection_name` and a `bundle_url` link. Checking Navi's full doc
set (`extraction-configuration.md`, `emit-configuration.md`,
`prerequisites.md`, every `samples/` page) confirms there is **no primitive
to join two different items of the same parsed array** — `parser`/`emit`
operate strictly within one item; `actions`/`paginated_actions` operate on
one whole response, never combining sibling items.

Resolution (see #1281): the crawler emits bundles and miniatures as **two
independent** extraction/emit passes over the same `GetMyLootsCache`
response — no join needed:

- `obj_type == "bundle"` records → the new `collections/import.json` (#1281),
  carrying the bundle's own `name`/`url`/`external_id` directly.
- `obj_type == "miniature"` records → the existing `stl_models/import.json`
  (#1262), carrying only `collection_external_id` (`bnd_inid`, already
  present on the miniature record itself — no join needed) plus the model's
  own fields. No `collection_name`/`links`/`url` on this side.

Both target the same `Collection` row (matched by `external_id`), so whichever
request lands first creates a stub (#1281 relaxes the existing
`CollectionSync` so a `name`-less creation no longer errors); the other fills
in/updates the real attributes. This also incidentally fixes
`emission-endpoint.md`'s "zero-miniature bundles produce no Collection" known
gap, since bundles are now emitted regardless of whether they currently have
owned miniatures.

## Expected Behavior

A Navi YAML config under `crawler/` (e.g. `crawler/navi_config.yaml`, layout
at the assignee's discretion — no dependencies/tooling exist yet beyond
`package.json`/`README.md`/`RUNNING.md`):

- `clients:` — `lootstudios` (`base_url: https://app.lootstudios.com`, plus
  realistic browser-like headers: `User-Agent`, `Accept`, `Accept-Language`
  — direct unheadered fetches were observed getting a flat `403`, per
  `emission-endpoint.md`'s "Request pacing/headers" note) and `majora_api`
  (base URL + `Authorization: Token $MAJORA_API_TOKEN`).
- A single `resources:` entry hitting
  `GET /wp-admin/admin-ajax.php?action=GetMyLootsCache` (cached/fetched once
  per run, not per bundle — per the spec's pacing note) with **two**
  `parser`/`emit` passes over the same `bundleObjs[]` array:
  1. Filter `obj_type == bundle` → fields `obj_inid → external_id`,
     `obj_title → name`, `obj_slug → slug` (used to build `url`:
     `https://app.lootstudios.com/bundle/{:slug}/`) → emit to
     `majora_api` `POST /miniatures/collections/import.json` (#1281) with
     `source_name: Lootstudios`.
  2. Filter `obj_type == miniature` → fields `obj_inid → external_id`,
     `obj_title → name`, `bnd_inid → collection_external_id` → emit to
     `majora_api` `POST /miniatures/stl_models/import.json` (#1262) with
     `source_name: Lootstudios`. No `collection_name`/`url`/`links` on this
     side (see "Why a second endpoint" above).
- No pagination for v1 (`GetMyLootsCache`'s pagination behavior is an open
  question — see #1282 — deferred rather than built speculatively).
- Credentials via environment variables, never committed: `MAJORA_API_TOKEN`
  (existing convention) and a Lootstudios session credential sent
  defensively as a `Cookie` header on the `lootstudios` client (exact
  cookie/env var name — proposed `LOOTSTUDIOS_SESSION_COOKIE` sent as
  `Cookie: PHPSESSID=$LOOTSTUDIOS_SESSION_COOKIE` — since #1282 hasn't yet
  confirmed whether `GetMyLootsCache` needs auth at all; sending it costs
  nothing if it turns out to be unnecessary).
- Update `crawler/RUNNING.md`'s `TBD` placeholders (left pending this issue
  by #1264) with the actual config path, the literal `navi-hey` invocation
  command, the chosen env var names, and whether the config runs headless or
  with the web UI enabled.

## Explicitly out of scope

- Any CI/cron/docker-compose wiring — manually-invoked, local-only tool per
  the parent issue's decision (Lootstudios' catalog endpoint is gated behind
  a personal logged-in session, not a service credential).
- Any STL site other than Lootstudios.
- Pagination — deferred to #1282's findings (see above).
- New Node.js dependencies/CLI wrapper beyond what running Navi itself
  requires (`docs/agents/external/HOW_TO_USE_NAVI.md`'s Option B,
  `navi-hey`).

## Testing strategy

No automated test suite is expected for a YAML config (nothing under
`crawler/` is wired into CI yet). Verification is manual, per
`crawler/RUNNING.md`'s existing "Verifying it worked" checklist: run the
config against a real Lootstudios session and confirm `Source`/`Collection`/
`StlModel` rows land correctly in Majora, including a second run over the
same catalog to confirm the upsert path updates in place rather than
duplicating or erroring — for both the bundle→`Collection` and the
miniature→`StlModel` emit passes.

## Acceptance criteria

- [ ] Navi config under `crawler/` extracts the maintainer's Lootstudios
      catalog and emits bundles to `collections/import.json` (#1281) and
      miniatures to `stl_models/import.json` (#1262) as two independent
      passes — no cross-item join.
- [ ] Re-running the config over an already-imported catalog updates existing
      `Collection`/`StlModel` rows rather than erroring or duplicating them,
      regardless of which of the two emit passes runs first.
- [ ] Credentials (Majora API token, Lootstudios session cookie) are supplied
      via environment variables, not committed.
- [ ] `crawler/RUNNING.md`'s `TBD` placeholders are filled in with the actual
      config path, invocation command, env var names, and run mode.

Owned by: `crawler`. Blocked on #1281 (backend `collections/import.json`).
