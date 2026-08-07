# Issue: Add stl search system

## Description
Majora currently only manages RPG campaign data (games, characters, treasures, ...). This issue starts a new, independent module — `miniatures`, a standalone top-level Django app — for cataloging STL 3D-printable files (most commonly game miniatures) that Majora does not host itself, only links to. This first issue introduces the core entities (`StlModel`, `StlModelLink`, `StlModelPhoto`, `Source`, `Tag`) and two read-only endpoints (list, show) scoped under `/miniatures/...json`, reusing the same database as the rest of the project.

## Problem
- There is currently no dedicated way to catalog STL files/links for 3D-printable miniatures in Majora. The only related thing that exists today is the generic `link_type='stl'` choice on `games.BaseLink`, usable on game/character links — there's no dedicated searchable/browsable entity, no tagging, no source tracking, and no display photo for this content.
- The `games` app isn't the right home for this: STL/miniature cataloging is independent of any specific game or campaign, and the issue explicitly says there is no game relationship for now.
- Unlike `Game` (which can be domain-restricted), the STL/miniature catalog is intentionally not domain-scoped at all — it's meant to be available across every domain, so it has no dependency on the domain concept being extracted out of `games` (see issue #1015, still a draft) and no `domain` field of its own.

## Expected Behavior
- Any authenticated user can `GET /miniatures.json` for a paginated list of `StlModel` entries (`id`, `name`, `photo_url`), using the existing shared `Paginator`.
- Any authenticated user can `GET /miniatures/<id>.json` for a single `StlModel`'s detail: `id`, `name`, `photo_url`, `links` (like game links), `sources` (`name`), `tags` (flat array of strings).
- Unauthenticated requests to either endpoint are rejected, matching the existing "logged-in users only" pattern.
- No create/update/delete endpoints exist yet for any of the new entities.
- No search/filter query parameters exist on the list endpoint yet, despite the issue title — deferred to a follow-up issue.
- No relationship to `games`/`Game`/`Character` exists yet.

## Solution

### New app: `miniatures`
A standalone top-level Django app (added to `INSTALLED_APPS` in `majora_project/settings.py`), mirroring the shape of `games`/`accounts`: `models/`, `serializers/`, `views/`, `urls/`, `admin.py`, `tests/` (mirroring the same tree).

### Models (`miniatures/models/`)
All five models get `history = HistoricalRecords(app='versioning', user_db_constraint=False, ...)`, matching every other model in the codebase (`Game`, `Character`, `GameLink`, `GamePhoto`, ...).
- `StlModel` — `name` (`CharField`), `photo` (nullable FK to `StlModelPhoto`, `on_delete=models.SET_NULL`, `related_name='+'`), `sources` (`ManyToManyField('miniatures.Source', related_name='stl_models', blank=True)`), `tags` (`ManyToManyField('miniatures.Tag', related_name='stl_models', blank=True)`).
- `StlModelLink` — extends `games.models.base_link.BaseLink` (reused as-is: `text`, `url`, `link_type` choices — `BaseLink` already declares its own `history`), `stl_model = ForeignKey(StlModel, on_delete=models.CASCADE, related_name='links')`. If STL links later need a distinct choice set from games/characters, `BaseLink` can be extracted into a shared/common module at that point — not needed here.
- `StlModelPhoto` — extends `games.models.base_photo.BasePhoto` (reused as-is: `path`, `ready` — `BasePhoto` already declares its own `history`), `stl_model = ForeignKey(StlModel, on_delete=models.CASCADE, related_name='photos')`.
- `Source` — `name` (`CharField`, unique), global deduplicated lookup table.
- `Tag` — `name` (`CharField`, unique), global deduplicated lookup table.

### Endpoints (`miniatures/urls/`, `miniatures/views/`)
Mounted at the root alongside `games.urls`/`accounts.urls` in `majora_project/urls.py`:
- `GET /miniatures.json` → list view, paginated via the existing shared `Paginator` (`games/paginator.py`), returns `id`, `name`, `photo_url` per row.
- `GET /miniatures/<id>.json` → detail view, returns `id`, `name`, `photo_url`, `links`, `sources` (`name` only), `tags` (flat array of strings).
- Both require authentication only — no ownership/game-scoping checks, matching the "shared repository" framing in the Big Picture.

### Admin
`miniatures/admin.py` registers all five models, so `Source`/`Tag` (and `StlModel`/`StlModelLink`/`StlModelPhoto`) can be managed via Django admin, since no create/update API endpoints exist yet.

### Documentation follow-up
`docs/agents/pagination.md` gains a convention note: all new list endpoints must use the shared `Paginator`; existing unpaginated endpoints are not retrofitted as a side effect of unrelated work.

## Benefits
- Gives Majora a dedicated, browsable catalog for STL/miniature files, decoupled from the `games` app so it can grow independently (e.g. later gaining its own search, tagging UI, or game linkage).
- Establishes the `Source`/`Tag` lookup-table pattern and the `/miniatures/...json` URL/module scoping convention that later STL issues (search, CRUD, game relationship) will build on.
- Reuses proven patterns (`BaseLink`, `BasePhoto`, the display-photo FK pattern, the shared `Paginator`) instead of introducing new ones, keeping the new module consistent with the rest of the codebase.
