# Issue: CharacterItem creation should create an empty CharacterItem in favor of GameItem

## Description
On the endpoints for creating a `CharacterItem`, the same submitted attributes (`name`, `description`, `hidden`) are currently used to create both the `GameItem` and the `CharacterItem`. This defeats the purpose of `CharacterItem`'s override/fallback design, where a null `CharacterItem` field is meant to fall back to its linked `GameItem`'s value.

While auditing the serializer endpoints involved, the single-entity "all fields" item endpoints were found to be misnamed: they use the `all.json` suffix, which should be reserved for collection endpoints, instead of the `full.json` suffix already used elsewhere in the project (e.g. `GET /games/:slug/pcs/:id/full.json`) for single-entity "everything including hidden" views. This issue also fixes that naming.

## Problem
- `_create_item` in `backend/games/views/game/_item_create.py` passes the same validated `name`/`description`/`hidden` dict to both `GameItem.objects.create(...)` and `CharacterItem.objects.create(...)`. As a result, a freshly created `CharacterItem` always has its own `name`/`description` set, so it never exercises the fallback-to-`GameItem` behavior until a future edit clears those fields.
- `.../items/:item_id/all.json` (single-entity, all-fields) is misnamed: `all.json` is otherwise used for collection/list endpoints (e.g. `.../items/all.json`) across the project, while single-entity "everything including hidden" endpoints use `full.json` (e.g. `.../pcs/:id/full.json`). This inconsistency exists on both the character-scoped item routes (`backend/games/urls/_character_routes.py:19`) and the game-scoped item routes (`backend/games/urls/games.py:58`).

## Expected Behavior
### Item creation
- The submitted attributes (`name`, `description`) are used to create the `GameItem`.
- `CharacterItem` is created linked to the `Character` and the new `GameItem`.
- `CharacterItem` is created with the given `hidden` attribute (same as today).
- The rest of `CharacterItem`'s fields (`name`, `description`) are left `null` — they will be set later via a future per-character item edit form (separate issue/PR).
- Serializer fallback for `name`/`description`/`photo` (via `resolve_character_item_field` in `backend/games/serializers/games/items/character_item_fields.py`) must continue to resolve to the linked `GameItem`'s value whenever `CharacterItem`'s own value is `null`, including when the `CharacterItem` is `hidden`.
- `hidden` is never resolved via fallback — it stays a plain, independent field on each of `GameItem` and `CharacterItem` (already the case today).

### Endpoint renaming (`all.json` → `full.json` for single entities)
- `GET /games/:game_slug/pcs/:id/items/:item_id/all.json` → `.../items/:item_id/full.json`
- `GET /games/:game_slug/npcs/:id/items/:item_id/all.json` → `.../items/:item_id/full.json`
- `GET /games/:game_slug/items/:item_id/all.json` → `.../items/:item_id/full.json`
- Collection endpoints (`.../items/all.json`, no `:item_id`) are unaffected — `all.json` remains correct for collections.
- Internal names are renamed to match, e.g. `CharacterItemDetailAllSerializer` → `CharacterItemDetailFullSerializer`, `build_item_detail_all_view` → `build_item_detail_full_view`, route name `item_detail_all` → `item_detail_full` (and the game-scoped equivalents).
- Frontend references to the old `/all.json` single-entity path are updated to `/full.json` (`frontend/assets/js/components/resources/item/pages/controllers/GameItemController.js:95` and `frontend/assets/js/components/resources/character/pages/controllers/CharacterItemDetailController.js:94`).

## Affected endpoints
### Creation (behavior change)
- `POST /games/:game_slug/pcs/:id/items.json`
- `POST /games/:game_slug/npcs/:id/items.json`

### Renamed (all.json → full.json, single entity only)
- `GET /games/:game_slug/pcs/:id/items/:item_id/all.json` → `full.json`
- `GET /games/:game_slug/npcs/:id/items/:item_id/all.json` → `full.json`
- `GET /games/:game_slug/items/:item_id/all.json` → `full.json`

### Verify fallback only (no behavior change expected, add/confirm test coverage)
- `POST /games/:game_slug/pcs/:id/items.json`
- `POST /games/:game_slug/npcs/:id/items.json`
- `GET /games/:game_slug/pcs/:id/items/all.json`
- `GET /games/:game_slug/npcs/:id/items/all.json`
- `GET /games/:game_slug/pcs/:id/items/:item_id.json`
- `GET /games/:game_slug/npcs/:id/items/:item_id.json`
- `GET /games/:game_slug/pcs/:id/items/:item_id/full.json` (renamed from `all.json`)
- `GET /games/:game_slug/npcs/:id/items/:item_id/full.json` (renamed from `all.json`)

### No fallback for `hidden`
`hidden` has no fallback: it is returned (and used in filters) directly from `CharacterItem`, independent of `GameItem` — already the case today, verify with a test.

## Solution
### Item creation
Modify `_create_item` in `backend/games/views/game/_item_create.py` so that:
- `GameItem.objects.create(...)` receives `name`/`description` from the validated payload (as today).
- `CharacterItem.objects.create(...)` receives only `character`, `game_item`, and `hidden` — not `name`/`description`.

Update the existing creation tests in `backend/games/tests/views/game/pcs/detail/items/game_pc_items_test.py` and the mirrored NPC tests, which currently assert `character_item.name`/`description` are set at creation time — these should assert the fields are `null` on the `CharacterItem` row while the API response still resolves `name`/`description` from the linked `GameItem` via the existing fallback serializer logic.

### Endpoint renaming
- `backend/games/urls/_character_routes.py:19`: rename route path `/items/<int:item_id>/all.json` → `/items/<int:item_id>/full.json`, and route name `item_detail_all` → `item_detail_full`.
- `backend/games/urls/games.py:58`: same rename for the game-scoped item route.
- `backend/games/views/game/_character_shared.py`: rename `build_item_detail_all_view` → `build_item_detail_full_view` (and any game-scoped equivalent).
- `backend/games/serializers/characters/character_item.py:69`: rename `CharacterItemDetailAllSerializer` → `CharacterItemDetailFullSerializer`; update `backend/games/serializers/__init__.py` exports and all references, including `backend/games/views/game/_item_create.py:41` (used for the creation response).
- Apply the equivalent rename to the game-scoped item detail-all serializer/view if separately named.
- `frontend/assets/js/components/resources/item/pages/controllers/GameItemController.js:95` and `frontend/assets/js/components/resources/character/pages/controllers/CharacterItemDetailController.js:94`: update the hardcoded `/all.json` single-entity path to `/full.json`.
- Update/rename any tests referencing the old route name, URL, or serializer/class names.
