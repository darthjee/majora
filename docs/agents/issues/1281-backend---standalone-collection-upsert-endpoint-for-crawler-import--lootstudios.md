# Issue: Backend — standalone Collection upsert endpoint for crawler import (Lootstudios)

## Description

Surfaced while discussing #1263 (Crawler — Navi configuration to extract and
import Lootstudios models). Sub-issue of the parent tracking issue #1260,
alongside the existing four-plus-three sub-issues.

The current crawler-import contract (`POST /miniatures/stl_models/import.json`,
#1262, already merged) can find-or-create a `Collection` only as a side effect
of an `StlModel` import — via `collection_name`/`collection_external_id` on the
`StlModel` payload (`backend/miniatures/serializers/_crawler_import_sync.py`'s
`CollectionSync`). `emission-endpoint.md`
(`docs/agents/specs/loot-crawling/emission-endpoint.md`) flagged this as a
**known gap**: a bundle with zero currently-owned miniatures produces no
`StlModel` emission, and therefore no `Collection` row at all, since there is
no standalone Collection-creation call. That page explicitly deferred fixing
this as "a separate concern."

Separately, while discussing #1263 it became clear Navi has **no primitive to
join two different items of the same parsed array** — confirmed by reading
`docs/agents/external/HOW_TO_USE_NAVI.md`'s full doc set
(`extraction-configuration.md`, `emit-configuration.md`, `prerequisites.md`,
every file under `samples/`). `parser`/`emit` operate strictly within one
item; `actions`/`paginated_actions` operate on one whole response. There is no
way for a Navi config to combine a Lootstudios miniature record with its
sibling bundle record (they live side-by-side in the same
`GetMyLootsCache` → `bundleObjs[]` array, distinguished by `obj_type`) into a
single emitted payload.

This issue's endpoint fixes both problems at once by letting the crawler emit
bundle (`Collection`) records and miniature (`StlModel`) records as two
**independent** passes over the same source response — no join required.

## Expected Behavior

- New endpoint `POST /miniatures/collections/import.json`, alongside the
  existing `POST /miniatures/stl_models/import.json` (#1262) in
  `backend/miniatures/`. Same auth (API token, staff/admin only — see
  `docs/guides/majora.md#authentication`) and same upsert precedence already
  established for `Collection` by #1262/#1268's contract: match by
  `external_id` first, then by `name`.
- Request body:
  - `name` (required)
  - `external_id` (optional, unique, nullable — same field/semantics as the
    existing `Collection.external_id` from #1268)
  - `url` (optional)
  - `source_name` (required) — resolves/creates the `Source` the same way
    `stl_models/import.json` already does (`SourceSync`), and (re)assigns it
    onto the `Collection`, matching `CollectionSync`'s existing
    `_reassign_source` behavior.
  - Response: `200`/`201` per found-vs-created, matching
    `stl_models/import.json`'s existing convention (see
    `backend/miniatures/views/stl_model_import.py`).
- **Relax `CollectionSync`'s existing find-or-create path** (used today by
  `stl_models/import.json` when a `StlModel` payload carries
  `collection_external_id` with no `collection_name`) so it no longer requires
  a `name` at creation time. Today, `Collection.name`
  (`backend/miniatures/models/collection.py`) is a plain
  `CharField(unique=True)` — not `null=True`/`blank=True` like
  `external_id` — so `CollectionSync._create()` would raise an
  `IntegrityError` if it ever tried to create a `Collection` with
  `name=None`. Pick one (implementer's call, whichever is simplest given the
  existing migration precedent from #1268):
  - Fall back to a guaranteed-unique placeholder (e.g. the `external_id`
    itself) when no `name` is given at creation time, or
  - Add a migration making `Collection.name` nullable/blank, with a sensible
    display fallback (e.g. `str(self)` falling back to `external_id`).
  - Either way: a `Collection` stub created this way (via a miniature import
    that only carries `collection_external_id`) is expected to be filled in
    with its real `name`/`url` by a **subsequent** call to this issue's new
    `collections/import.json` endpoint — order-independent, since both calls
    upsert by the same `external_id`.
- Document the new endpoint in `docs/guides/majora/miniatures.md`, following
  the existing `stl_models/import.json` entry's format/placement.

## Explicitly out of scope

- The actual Navi configuration that calls this endpoint — that is #1263
  (blocked on this issue landing).
- Anything about Lootstudios' own API shape — already documented in
  `docs/agents/specs/loot-crawling/source-to-collections.md` and
  `collection-to-stl-models.md`.
- Changing `stl_models/import.json`'s existing request/response contract
  beyond the `CollectionSync` relaxation described above.

## Testing strategy

Standard backend test coverage (`docker-compose run backend poetry run
pytest`), following the existing test layout for `stl_models/import.json`
(`backend/miniatures/tests/views/stl_model_import_test.py`,
`backend/miniatures/tests/serializers/stl_model_import_test.py`,
`_crawler_import_sync_test.py`) as the closest precedent:

- Create-by-`external_id`, create-by-`name`-only (no `external_id`), update
  found-by-`external_id`, update found-by-`name` (fallback).
- `source_name` resolves/creates and (re)assigns `Source` the same way
  `stl_models/import.json` already does.
- A `StlModel` import that creates a `Collection` stub via
  `collection_external_id` alone, followed by a `collections/import.json`
  call for the same `external_id`, results in one `Collection` row with the
  real `name`/`url` — not two rows, not an `IntegrityError`.
- Auth/permission parity with `stl_models/import.json` (staff/admin only).

## Acceptance criteria

- [ ] `POST /miniatures/collections/import.json` upserts a `Collection` by
      `external_id` first, then `name`, matching `stl_models/import.json`'s
      established precedent and auth requirements.
- [ ] `CollectionSync`'s existing find-or-create path no longer raises an
      `IntegrityError` when only `external_id` (no `name`) is given —
      whether via a placeholder name or a nullable `name` migration.
- [ ] A `Collection` stub created by a miniature-only import (via
      `collection_external_id`) is correctly filled in by a later
      `collections/import.json` call for the same `external_id`, without
      creating a duplicate row.
- [ ] The new endpoint is documented in `docs/guides/majora/miniatures.md`.
- [ ] Backend tests cover create/update-by-`external_id`,
      update-by-`name`-fallback, `Source` resolution, and the stub-then-fill
      sequence above.

Owned by: `backend` (review: `security`, `data-access`).
