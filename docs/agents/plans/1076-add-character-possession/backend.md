# Backend Plan: Add Character Possession

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" for the model shape, permission table, and full endpoint list. This file covers how to build them.

## Implementation Steps

### Step 1 — Model

Create `backend/games/models/character/character_possession.py`, copying `backend/games/models/character/character_document.py`'s shape exactly: `character` FK (`CASCADE`, `related_name='character_possessions'`), `game_possession` FK (`CASCADE`, `related_name='character_possessions'`), `hidden` (`BooleanField`, default `False`), `HistoricalRecords(app='versioning', user_db_constraint=False)`, `Meta.ordering = ['id']`, `Meta.unique_together = [('character', 'game_possession')]`, `__str__` returning `self.game_possession.name`. Register in `backend/games/models/__init__.py`. Follow [docs/agents/models-organization.md](../../models-organization.md).

### Step 2 — Migration

Run makemigrations inside the dev container (`docker-compose run --rm majora_be python manage.py makemigrations`, or the project's `make` equivalent) to generate the migration for the new model.

### Step 3 — Serializers

Create `backend/games/serializers/characters/character_possession.py` with `CharacterPossessionSerializer` (fields: `id`, `game_possession_id`, `name`, `description`, `photo_path`, all `source='game_possession.*'`, read-only — copy `CharacterDocumentSerializer`'s shape in `backend/games/serializers/characters/character_document.py`) and `CharacterPossessionAllSerializer(HiddenFieldMixin, CharacterPossessionSerializer)` adding `hidden`. Register both in `backend/games/serializers/__init__.py`. Follow [docs/agents/serializers-organization.md](../../serializers-organization.md).

### Step 4 — Permission resource name + config

Add `_character_possession_resource(character)` to `backend/games/views/game/_shared.py`, returning `'game_pc_possession'` / `'game_npc_possession'` (copy `_character_document_resource`'s shape).

Create `backend/permissions/config/game_pc_possession/endpoints.yml` and `backend/permissions/config/game_npc_possession/endpoints.yml` with the table from [plan.md](plan.md)'s Shared contracts — `restricted.create` and `regular.create_update`, no `photo_upload`. Add a comment explaining the `restricted`/`regular` split the same way `game_pc_item/endpoints.yml` does (which action uses which tier, and why NPC drops `owner`).

### Step 5 — Create-from-scratch view logic

Create `backend/games/views/game/_possession_create.py`, copying `backend/games/views/game/_item_create.py`'s shape: a validation-only `_CharacterPossessionCreateSerializer` (`name`, `description`, `hidden`), and `character_possession_create(request, game, character)` that checks `EndpointPermission(...).check(request, _character_possession_resource(character), 'regular', 'create_update')`, then atomically creates a `GamePossession` (full `validated_data`) and a linked `CharacterPossession` (just `hidden` + the FKs), returning the serialized result (use `CharacterPossessionAllSerializer`, matching how `_item_create.py` returns `CharacterItemDetailFullSerializer`) at `201`.

### Step 6 — Acquire/remove/available view logic

Create `backend/games/views/game/_possession_exchange.py`, copying `backend/games/views/game/_item_exchange.py`'s shape exactly (unconditional `restricted`/`create` tier, no `allow_hidden`-based tier switch like Document has — see [plan.md](plan.md)'s "Shared contracts" for why): `character_possessions_available` (paginated `game.possessions` minus already-owned, optional name filter via `filter_by_name`), `character_possession_acquire` (validates `game_possession_id` + optional `hidden`, `get_or_create`s the `CharacterPossession`, 422 on duplicate), `character_possession_remove` (validates `game_possession_id`, 404s if not owned/hidden-without-`allow_hidden`, deletes the join only — `GamePossession` is untouched).

### Step 7 — Detail view logic

Add `character_possession_detail` alongside the other character-resource detail helpers (wherever `character_document_detail`/`character_item_detail` live — check `_character_shared.py` or a sibling `_possession_detail.py` depending on how Document's/Item's equivalents are organized), GET-only, thin — no `PATCH` branch, mirroring `build_document_detail_view`'s comment ("nothing left on `CharacterDocument`/`CharacterPossession` to edit").

### Step 8 — View builders + per-route files

In `backend/games/views/game/_character_shared.py`, add the builder functions: `build_possessions_view` (GET/POST combined, POST branch calls `character_possession_create` — copy `build_items_view`'s shape including its NPC hidden-gate check), `build_possessions_all_view`, `build_possession_detail_view` (copy `build_document_detail_view`), `build_possession_detail_full_view`, `build_possessions_available_view`/`_all_view`, `build_possession_acquire_view`/`_all_view`, `build_possession_remove_view`/`_all_view` — each copying its Item/Document counterpart's shape (acquire/remove/available structurally match Item's, since Possession's exchange tier is unconditional `restricted` like Item's, not Document's varying tier).

Add the per-route thin view files under `backend/games/views/game/pcs/detail/possessions/` and `backend/games/views/game/npcs/detail/possessions/` (one file per action, e.g. `game_pc_possessions.py`, `game_pc_possessions_all.py`, `game_pc_possession_detail.py`, `game_pc_possession_detail_full.py`, `game_pc_possessions_available.py`, `game_pc_possessions_available_all.py`, `game_pc_possession_acquire.py`, `game_pc_possession_acquire_all.py`, `game_pc_possession_remove.py`, `game_pc_possession_remove_all.py`, + `npc_` equivalents), each a 1-3 line delegation to the shared builder — copy the shape of the equivalent `items`/`documents` files. Wire the new names through `pcs/detail/__init__.py` → `pcs/__init__.py` → `games/views/game/__init__.py`'s `__all__`, and the NPC mirror, per [docs/agents/views-organization.md](../../views-organization.md).

### Step 9 — URL routes

Add the possession route suffixes to `_CHARACTER_ROUTES` in `backend/games/urls/_character_routes.py` (see [plan.md](plan.md)'s endpoint list) — no `photo_upload`/update entries, since there's no character-level override.

### Step 10 — Tests

Mirror the existing `character_document`/`character_item` test coverage: `backend/games/tests/models/character/character_possession_test.py`, `backend/games/tests/serializers/characters/character_possession_test.py` (+ `_all_test.py`), and view tests under `backend/games/tests/views/games/pcs/detail/possessions/` and `.../npcs/detail/possessions/` (list, create, detail, acquire, remove, available, all permission tiers — PC owner/player/staff, NPC staff/player, unauthenticated). Add a factory (`backend/games/tests/factories/character_possession.py`, mirroring `character_document.py`'s or `character_item.py`'s factory) and extend `backend/games/tests/factories/__init__.py`. Add the new permission rows to `backend/games/tests/views/permissions/game_permissions_test.py`.

### Step 11 — Docs

Update [docs/agents/access-control.md](../../access-control.md) with `CharacterPossession`'s per-role access rules, per the project convention (this doc is "updated alongside any new model or endpoint").

## Files to Change

- `backend/games/models/character/character_possession.py` — new model
- `backend/games/models/__init__.py` — register model
- `backend/games/migrations/<new>.py` — generated migration
- `backend/games/serializers/characters/character_possession.py` — new serializers
- `backend/games/serializers/__init__.py` — register serializers
- `backend/games/views/game/_shared.py` — `_character_possession_resource`
- `backend/games/views/game/_possession_create.py` — new, create-from-scratch logic
- `backend/games/views/game/_possession_exchange.py` — new, acquire/remove/available logic
- `backend/games/views/game/_character_shared.py` — new builder functions
- `backend/games/views/game/pcs/detail/possessions/*.py` — new per-route files
- `backend/games/views/game/npcs/detail/possessions/*.py` — new per-route files
- `backend/games/views/game/pcs/detail/__init__.py`, `.../pcs/__init__.py`, `.../npcs/detail/__init__.py`, `.../npcs/__init__.py`, `backend/games/views/game/__init__.py` — re-exports
- `backend/games/urls/_character_routes.py` — new route entries
- `backend/permissions/config/game_pc_possession/endpoints.yml` — new
- `backend/permissions/config/game_npc_possession/endpoints.yml` — new
- `backend/games/tests/**` — model/serializer/view/permission test coverage
- `backend/games/tests/factories/character_possession.py` — new factory
- `docs/agents/access-control.md` — new access rules

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI job: backend test suite in `.circleci/config.yml`)
- `backend`: `docker-compose run --rm majora_be ruff check .` (CI job: backend lint)

## Notes

- Double-check whether `character_document_detail`/`character_item_detail` (the underlying detail-fetch functions, as opposed to the `build_*_view` wrappers) live in `_character_shared.py` directly or a dedicated file — follow whichever precedent is actually in place when writing `character_possession_detail`.
- `_item_exchange.py`'s `character_item_acquire`/`_remove` always check `restricted`/`create` regardless of `allow_hidden` — confirm `character_possession_acquire`/`_remove` do the same (per the corrected permission decision in the issue), not Document's `allow_hidden`-dependent tier switch.
