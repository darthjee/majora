# Issue: Backend — dedicated crawler-import endpoint for Source/Collection/StlModel

## Description

Sub-issue of the parent tracking issue #1260 (Lootstudios STL Crawler). It is a
prerequisite for the later "Navi configuration" sub-issue, which will POST to
this endpoint.

**Update:** this issue originally assumed `url` as the sole upsert key and no
dependency on the Lootstudios exploration issue (#1261). That's since been
revised: #1261's dialogue confirmed Lootstudios exposes a stable per-item
external id (`obj_inid`, e.g. `FN2608AC01`) distinct from any scraped `url` —
a materially better upsert/dedup key. This issue's contract now accounts for
that (see "Expected Behavior" below), so it is **no longer fully independent**
of #1261 — the exact field semantics here are informed by that exploration,
though this issue can still proceed without waiting for #1261's own doc
sub-issues to land, since the shape below is already decided.

**Update:** the emission-endpoint spec (#1267,
`docs/agents/specs/loot-crawling/emission-endpoint.md`) has since settled on
`POST /miniatures/stl_models/import.json` as the crawler's actual emission
target — including a Navi `body_template` sketch that hardcodes that literal
path — so the endpoint path below is no longer left to the assignee's
discretion; it's authoritative (see "Expected Behavior"). Separately, a
temporary staff-only debug harness (`POST`/`GET /staff/crawler.json`, spec'd
in #1272, implemented in #1273/#1275) exists so the crawler's emissions can be
inspected before being wired into this real import endpoint. Rollout order is
to implement and use the debug harness first to validate what the crawler
emits, then switch the crawler over to this endpoint once trusted — both
endpoints end up documented (`/staff/crawler.json` per #1272's spec,
`/miniatures/stl_models/import.json` here in
`docs/guides/majora/miniatures.md`). This issue's own contract/acceptance
criteria are unaffected by that sequencing — #1273/#1275 have no code
dependency on this issue — it's noted here purely for implementation-order
context.

## Problem

The existing miniatures write endpoints
(`docs/guides/majora/miniatures.md`) aren't a good fit for a crawler that
re-runs repeatedly over the same catalog:

- `POST /miniatures/stl_models.json` requires a unique `url` and returns `400`
  on a duplicate — a second crawl of an already-imported item would fail
  outright. Worse, relying on `url` alone as the identity key is fragile: a
  source site can restructure its URLs without the underlying item changing.
- Creating an `StlModel` requires `source_ids`/`collection_ids` referencing
  *already-existing* `Source`/`Collection` rows — but the crawler discovers
  sources/collections (Lootstudios itself, and each bundle) as it goes; nothing
  pre-populates them. The same fragility applies to matching a `Collection` by
  `name` alone (a bundle's title could be edited upstream).
- STL models from an external catalog have no equivalent of Majora's
  `type`/`race`/`role`/`size` taxonomy fields, but `type` is required by the
  existing create endpoint.

Having the crawler defensively `GET`-then-`POST`/`PATCH` per item, and
pre-create every `Source`/`Collection` by hand, would be fragile and slow. A
single purpose-built endpoint keeps this upsert logic in one place, testable
independently of any crawler code.

## Expected Behavior

A new endpoint under `backend/miniatures/` at the **fixed** path
`POST /miniatures/stl_models/import.json` — this path is authoritative, not
merely an example: #1267's emission-endpoint spec
(`docs/agents/specs/loot-crawling/emission-endpoint.md`) and its Navi
`body_template` sketch already hardcode it as the crawler's emission target,
so the implementer must not pick a different path/name. File organization
follows the existing `backend/miniatures/{views,urls,serializers}/`
per-resource, one-file-per-action folder convention already used for e.g.
`stl_models_list.py`/`source_create.py`/`collection_create.py` — see
`docs/agents/views-organization.md` / `docs/agents/serializers-organization.md`
for the general convention, noting that doc's nested-folder scheme is
documented as `games/`-specific; `miniatures/` already follows a simpler flat
layout, which the new endpoint should match:

- **Auth**: same as the rest of the miniatures write endpoints — staff/admin
  only (`user.is_staff or user.is_superuser`), API token via `Authorization:
  Token <key>` (`CookieTokenAuthentication`, the DRF-wide default).
- **Request body**: one item per call only — no array/batch support (a single
  JSON object body, matching the existing single-item create/update
  endpoints), carrying:
  - `name` (required).
  - `external_id` (optional, opaque string) — the source system's own stable
    identifier for this item (e.g. Lootstudios' `obj_inid`). Deliberately
    generic, not Lootstudios-specific — this endpoint stays source-agnostic per
    "Explicitly out of scope" below.
  - `url` (optional, same validation as the existing create endpoint) — kept as
    a fallback identifier for callers that don't have a stable external id.
  - `source_name` (required) — find-or-create a `Source` by that name.
  - `collection_name` (optional) — find-or-create a `Collection` by that name.
    Note: `Collection.name` is a globally unique field, and `Collection.source`
    is an optional (nullable) FK, not a required per-source scope — so this
    lookup is global, not scoped under the resolved `Source` (see "Upsert
    semantics for `Collection`" below for how the resolved `Source` still gets
    applied to the row).
  - `collection_external_id` (optional) — same idea as `external_id`, applied
    to the `Collection` lookup (a bundle also has a stable id upstream); when
    given, takes precedence over `collection_name` for matching an *existing*
    `Collection`, the same way `external_id` takes precedence over `url` for
    `StlModel` below.
  - Anything else the existing `stl_models.json` create endpoint already
    accepts optionally (`tags`, etc.).
- **Upsert semantics for `StlModel`**: look up an existing row first by
  `external_id` (if given), then by `url` (if given and no `external_id` match
  was found). If found, update it (treat this like the existing `PATCH`
  semantics — set whichever fields the caller sent). If neither matches,
  create it with `type: "other"` (Majora's required field, defaulted since the
  source data has no equivalent) and `race`/`role` (separate many-valued
  `StlModelRace`/`StlModelRole` join rows, not fields on `StlModel` itself) /
  `size` left unset — staff refine these later through the existing `PATCH
  /miniatures/stl_models/<id>.json` flow. Whichever of `external_id`/`url` was
  sent is (re)stored on the row either way.
- **Upsert semantics for `Collection`**: same pattern — `collection_external_id`
  first, `collection_name` as fallback — but matched **globally**, not scoped
  by `Source` (`Collection.name` is a globally unique field). Once
  found/created, set the row's `source` FK to the resolved `Source` regardless
  of its prior value (assign if null, overwrite if it pointed elsewhere) — the
  resolved `Source` always wins. If not found, create it with `source` set to
  the resolved `Source`.
  *(Note: as with `external_id` below, a same-named `Collection` reused across
  two different sources would have its `source` silently reassigned to
  whichever source is imported last — acceptable for now since Lootstudios is
  the only source; same known-limitation category as the `external_id`
  collision note below.)*
- **`Source`**: matched/created by `name` only (no external id — there's one
  `Source` row per crawled site as a whole, not a per-item concept).
- **Model changes required**: `StlModel` and `Collection` each need a new
  `external_id` field (`CharField`, nullable, blank-allowed, unique — MySQL
  permits multiple `NULL`s in a unique column, so items imported without one
  don't collide). New migration(s) in `backend/miniatures/migrations/`.
  *(Note: if a second, unrelated crawler source is added later, a bare unique
  `external_id` could collide across sources with different id schemes — out
  of scope for now since Lootstudios is the only source; flagged here as a
  known limitation rather than solved.)*
- Also accept/set a `links` entry with `link_type: "lootstudio"` pointing back
  at the source `url` (when present), reusing the existing `StlModel.links`
  mechanism (`StlModelLink`/`BaseLink`) — `lootstudio` is already a defined
  choice on that field (`LINK_TYPE_LOOTSTUDIO`), so no new enum value needs
  adding — so imported models carry a visible link back to their Lootstudios
  page.
- For the `Source`/`Collection` find-or-create logic, model the implementation
  on the existing `TagsSync` pattern
  (`backend/miniatures/serializers/_tags_sync.py`, wrapping
  `Model.objects.get_or_create(...)` in a `transaction.atomic()` block) —
  currently the closest precedent in this codebase, even though it's for
  `Tag`, not `Source`/`Collection`.
- **Response**: full `StlModel` detail (same shape as the existing
  detail/create endpoints), so the crawler can log what happened.
- Document the new endpoint in `docs/guides/majora/miniatures.md` alongside the
  existing ones.

## Explicitly out of scope

- Any Lootstudios-specific logic — this endpoint is generic ("crawler import"),
  not Lootstudios-aware; it just accepts already-normalized fields, including a
  source-agnostic `external_id`. The crawler (a separate sub-issue) is
  responsible for mapping Lootstudios' actual response shape (`obj_inid`,
  `bnd_inid`, etc.) onto this contract.
- Namespacing `external_id` per source to avoid cross-source collisions — not
  needed while Lootstudios is the only source; noted as a known limitation
  above.
- Photo/image import — `StlModel`s created here simply have no photo until
  someone uploads one through the existing photo-upload flow.
- Bulk/batch endpoint semantics — the endpoint accepts exactly one item per
  call; the crawler is responsible for looping over its catalog and calling it
  once per `StlModel`.

## Testing strategy

Standard `pytest`/`pytest-django` coverage under
`backend/miniatures/tests/views/` and `.../serializers/`, following the existing
per-resource test-file convention: create-new-item (with and without
`external_id`), update-existing-item-by-`external_id`,
update-existing-item-by-`url`-fallback, `external_id` match takes precedence
over a coincidentally-matching `url`, auto-create-`Source`,
auto-create/match-`Collection`-by-`external_id`-and-by-`name`-fallback,
matched-`Collection`-gets-its-`source`-FK-(re)assigned-to-the-resolved-`Source`
(including when it previously pointed to a different `Source` or was null),
auth (staff-only, 401/403 cases matching the other write endpoints).

## Acceptance criteria

- [ ] New endpoint exists at the fixed path
      `POST /miniatures/stl_models/import.json`, staff/admin-only, documented
      in `docs/guides/majora/miniatures.md`
- [ ] `StlModel` and `Collection` have a new nullable, unique `external_id`
      field (migration included)
- [ ] Find-or-create semantics work for `Source` (by `name`) and `Collection`
      (by `external_id` first, `name` fallback)
- [ ] Upsert semantics work for `StlModel`: `external_id` first, `url`
      fallback, create with `type: "other"` default when neither matches
- [ ] A `lootstudio`-typed link back to the source `url` is set on
      created/updated `StlModel`s when a `url` is present
- [ ] Reviewed by `security` and `data-access` (new write endpoint, new
      implicit-creation behavior, new unique fields)

Owned by: `backend` (review: `security`, `data-access`).
