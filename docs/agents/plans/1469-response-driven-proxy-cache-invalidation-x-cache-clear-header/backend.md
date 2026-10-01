# Backend Plan: Response-driven proxy cache invalidation (X-Cache-Clear header)

Main plan: [plan.md](plan.md)

## Shared contracts

The backend **produces** `X-Cache-Clear`: a comma-separated list of literal `.json` request paths (starting with `/`, no placeholders/query/`..`), set on:

- the staff-origin finalize 200 that carries `previous_path` (`PATCH /uploads/image/<id>.json` → `uploaded`);
- the staff photo delete 204 (`DELETE /staff/photos/<photo_type>/<photo_id>.json`).

Omitted when no owner can be resolved, and on every other response.

## Implementation Steps

### Step 1 — Declare cache targets per photo type

Give each `PhotoType` in `backend/staff/photo_types.py` a `cache_paths(owner)` method returning the list of literal paths to clear for an owner (empty list when the owner is None). Mirror the target lists already used in `proxy/extension/lib/configuration/cache_cleanup/*.php` (entity + collection + `full`/`all`/`photos` variants) so a cleared entry matches what route-driven cleanup clears for the same entity, e.g.:

- `game`: `/games.json`, `/my-games.json`, `/games/<slug>.json`
- `game_faction`: `/games/<slug>/factions.json`, `/games/<slug>/factions/<id>.json`
- `game_item`: the items family (`items.json`, `items/all.json`, `items/<id>.json`, `items/<id>/full.json`)
- `game_document` / `game_document_file`: the documents family of the owning document (incl. `photos`/`files` lists)
- `game_possession`: the possessions family
- `character`: `pcs`/`npcs` family by kind (`.json`, `all.json` for npcs, `<id>.json`, `<id>/full.json`, `<id>/photos.json`)
- `character_item`: the character's items family (`pcs|npcs/<char>/items...`)
- `treasure`: `/treasures.json`, `/treasures/<id>.json`, `/games/<slug>/treasures.json`, `/games/<slug>/treasures/<id>.json` (game-less treasures: only the top-level ones)
- `game_common_item`, `stl_model`, `source`, `collection`: derive from their public URL confs (`urls.py` of `games` / `miniatures`), entity + collection paths.

Use subclasses / per-entry callables where the shape differs (characters by kind, document files through their document), following the existing `CharacterPhotoType`-style overrides. Add a small helper (e.g. `backend/staff/cache_clear_header.py`) that formats the list as the header value and sets it on a DRF `Response` (no-op when the list is empty).

### Step 2 — Emit the header on finalize and delete

- `backend/uploads/staff_upload_finalizer.py`: in `_uploaded_response`, when `previous_path` is returned, resolve the photo's registry entry (`photo_types.find_for_model`) and owner, and attach `X-Cache-Clear` with `cache_paths(owner)`.
- `backend/staff/staff_photo_deleter.py`: resolve the owner **before** `photo.delete()` (for `game_document_file` the owner is found through a reverse lookup that disappears on delete), and attach `X-Cache-Clear` to the 204. For gallery types, the owner is the same whether or not it was re-pointed.

Tests (pytest): `cache_paths` for every photo type (incl. None owner, pc vs npc, game-less owners); finalize sends the header only with `previous_path`; delete 204 carries the header, 422/404/403 do not.

## Files to Change

- `backend/staff/photo_types.py` — `cache_paths(owner)` per entry.
- `backend/staff/cache_clear_header.py` (new) — header formatting helper.
- `backend/uploads/staff_upload_finalizer.py` — header on extension-changing finalize.
- `backend/staff/staff_photo_deleter.py` — header on delete 204.
- `backend/staff/tests/...`, `backend/uploads/tests/views_finalize_staff_test.py` — specs.

## CI Checks

- `backend`: `poetry run pytest` and python lint, run through docker-compose (CI jobs: backend tests / `Check python Lint`).

## Notes

- The per-caller private cache (`/games/<slug>/(pcs|npcs)/(all|<id>/full).json`, `PrivateRequestHasher`) is keyed differently; listing those paths is still correct, but the proxy agent confirms whether clearing the path directory also clears the private entries (they also expire via `CacheStalenessMiddleware` after 10s).
