# Backend Plan: CharacterItem creation should create an empty CharacterItem in favor of GameItem

Main plan: [plan.md](plan.md)

## Shared contracts

- Produces the renamed route `GET /games/:game_slug/items/:item_id/full.json` (and the pcs/npcs equivalents) that `frontend` will call and `proxy` will list as a cache target. Response shape is unchanged (same serializer fields), only the URL path suffix and the serializer/view/route internal names change.
- `POST .../pcs/:id/items.json` / `.../npcs/:id/items.json` keep the same request/response contract; only the persisted `CharacterItem.name`/`description` values change (become `null` instead of duplicating `GameItem`'s values). `hidden` behavior is unchanged.

## Implementation Steps

### Step 1 — Stop duplicating name/description onto CharacterItem at creation

In `backend/games/views/game/_item_create.py`, `_create_item(game, character, validated_data)` currently does:

```python
game_item = GameItem.objects.create(game=game, **validated_data)
return CharacterItem.objects.create(
    character=character, game_item=game_item, **validated_data
)
```

Change it so `GameItem` still gets the full `validated_data` (`name`, `description`, `hidden`), but `CharacterItem` only gets `hidden` from it plus the `character`/`game_item` links — `name`/`description` are omitted so they default to `null` on the model. Update the module docstring/function docstrings (lines 1, 26-29, 45) which currently describe the old "duplicated verbatim onto both rows" behavior.

### Step 2 — Update existing creation tests

- `backend/games/tests/views/game/pcs/detail/items/game_pc_items_test.py`:
  - `test_create_persists_game_item_and_character_item` (currently asserts `character_item.name == 'Sting'`) — assert `character_item.name is None` instead, while `game_item.name == 'Sting'` stays.
  - `test_owner_can_create_item` — the response body's `data['name']`/`data['description']` should still resolve to the submitted values via the serializer's fallback (behavior unchanged from the caller's point of view); double check this test still passes as-is, since it asserts response data, not raw model fields.
  - Add a case (or extend an existing one) explicitly asserting `character_item.description is None` after creation with a submitted description, to mirror the `name` assertion.
- Mirror the same updates in `backend/games/tests/views/game/npcs/detail/items/game_npc_items_test.py`.

### Step 3 — Rename `all.json` → `full.json` for single-entity item endpoints

Character-scoped (pcs/npcs, shared route table):
- `backend/games/urls/_character_routes.py:19` — change `('/items/<int:item_id>/all.json', 'item_detail_all')` to `('/items/<int:item_id>/full.json', 'item_detail_full')`. Check `_character_route`/route-naming helpers (lines 43-49) so the generated named routes become `game-pc-item-detail-full` / `game-npc-item-detail-full`.
- `backend/games/views/game/_character_shared.py` — rename `build_item_detail_all_view` → `build_item_detail_full_view` (and update its usage in the routes file / wherever it's wired up).

Game-scoped:
- `backend/games/urls/games.py:58` — apply the same `all.json` → `full.json` rename to the game-scoped `.../items/:item_id/all.json` route, and rename its view builder/name equivalently if separately defined.

Serializers:
- `backend/games/serializers/characters/character_item.py:69` — rename `CharacterItemDetailAllSerializer` → `CharacterItemDetailFullSerializer`.
- Update the export in `backend/games/serializers/__init__.py` (lines ~16-17, ~112-113) and every reference, including `backend/games/views/game/_item_create.py:41` (creation response) and wherever the game-scoped item detail-all serializer/view lives (find via the game-scoped route from Step 3 above — likely near `game_item_detail_all_test.py`'s subject).

### Step 4 — Rename affected test files/identifiers

Rename test files and internal test names that reference "detail_all"/"DetailAll" for items to "detail_full"/"DetailFull", to stay consistent with the renamed production code:
- `backend/games/tests/views/game/pcs/detail/items/game_pc_item_detail_all_test.py` → `game_pc_item_detail_full_test.py` (update URL/route-name references inside).
- `backend/games/tests/views/game/npcs/detail/items/game_npc_item_detail_all_test.py` → `game_npc_item_detail_full_test.py`.
- `backend/games/tests/views/games/game_item_detail_all_test.py` → `game_item_detail_full_test.py`.
- Any serializer test referencing `CharacterItemDetailAllSerializer` (check `backend/games/tests/serializers/characters/character_item_all_test.py`) — rename/update to match `CharacterItemDetailFullSerializer`.
- Double-check `backend/games/tests/serializers/games/items/` for a game-item equivalent serializer test that needs the same treatment.

### Step 5 — Verify serializer fallback behavior with tests

Per the issue's "no fallback for `hidden`" and fallback-for-`name`/`description`/`photo` requirements — this logic already exists in `backend/games/serializers/games/items/character_item_fields.py` (`resolve_character_item_field`, excludes `hidden`). No production code change expected here; confirm/add test coverage (e.g. in `backend/games/tests/serializers/games/items/character_item_fields_test.py` and/or the creation tests from Step 2) that:
- A `CharacterItem` created via the fixed creation endpoint (`name`/`description` = `null`) resolves `name`/`description` from its `game_item` in the API response, even when `hidden=True`.
- `hidden` in the response always reflects `CharacterItem.hidden` directly, never falling back to `GameItem.hidden`.

## Files to Change

- `backend/games/views/game/_item_create.py` — stop passing `name`/`description` to `CharacterItem.objects.create`; update docstrings.
- `backend/games/tests/views/game/pcs/detail/items/game_pc_items_test.py` — update/extend creation assertions.
- `backend/games/tests/views/game/npcs/detail/items/game_npc_items_test.py` — mirror the above.
- `backend/games/urls/_character_routes.py` — rename route path/name for `item_detail_all` → `item_detail_full`.
- `backend/games/urls/games.py` — rename the game-scoped `items/:item_id/all.json` route equivalently.
- `backend/games/views/game/_character_shared.py` — rename `build_item_detail_all_view` → `build_item_detail_full_view`.
- `backend/games/serializers/characters/character_item.py` — rename `CharacterItemDetailAllSerializer` → `CharacterItemDetailFullSerializer`.
- `backend/games/serializers/__init__.py` — update the renamed export.
- `backend/games/views/game/_item_create.py` — update the serializer reference used for the creation response.
- Game-scoped item detail-all view/serializer (locate via `backend/games/tests/views/games/game_item_detail_all_test.py` and `backend/games/urls/games.py:58`) — rename equivalently.
- `backend/games/tests/views/game/pcs/detail/items/game_pc_item_detail_all_test.py` → renamed, updated.
- `backend/games/tests/views/game/npcs/detail/items/game_npc_item_detail_all_test.py` → renamed, updated.
- `backend/games/tests/views/games/game_item_detail_all_test.py` → renamed, updated.
- `backend/games/tests/serializers/characters/character_item_all_test.py` (and game-item equivalent under `backend/games/tests/serializers/games/items/`) — updated for the serializer rename.
- `backend/games/tests/serializers/games/items/character_item_fields_test.py` — add/confirm fallback coverage under the new creation behavior.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`) — covers the pcs/npcs item creation and detail-full tests.
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`) — covers the game-scoped item detail-full tests.
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`) — covers model/serializer-level tests (`character_item_fields_test.py`, `character_item_all_test.py`, etc).

## Notes

- Double-check whether the game-scoped items resource (`backend/games/urls/games.py`) has its own dedicated "detail all" serializer/view or reuses `CharacterItemDetailAllSerializer`/similar — exploration found the route but not yet the exact serializer name; confirm during implementation before renaming.
- `hidden` semantics are explicitly unchanged by this issue (still written to both `GameItem` and `CharacterItem` from the same payload field at creation) — do not "fix" that as part of this issue, it was confirmed intentional during discussion.
