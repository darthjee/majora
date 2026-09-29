# Tests

Use the pytest-class style of the existing recipe tests: `TokenAuthRequestMixin`, the factories,
and an inline role setup.

## POST `/games/<slug>/recipes.json`

- Role matrix:
  - anonymous: 401
  - non-member: 403
  - player, staff, dm, superuser: 201
- Field defaults.
- Bounds:
  - `name` missing, blank or 201 chars
  - `yield_quantity` 0 or 2147483648
  - `crafting_cost` -1 or 2147483648
  - `crafting_time` 201 chars
- `game_common_item_id` that is missing, `"abc"`, `true` or huge: 400.
- Unknown, cross-game and hidden `game_common_item_id` on the regular tier all return 400 with an
  identical body. Compare `response.content`.
- A hidden output item is accepted for dm.
- Response shape per tier:
  - plain: no `hidden`, and `output` is `null` when the output item is hidden
  - dm: full shape
- A regular caller posting `hidden: true` gets 201 with the plain shape. A later plain GET then
  returns 404.
- `X-Skip-Cache` is present on every status.
- Mass assignment: `game` and `id` in the body are ignored.

## PATCH `/games/<slug>/recipes/<id>.json`

- The same role matrix.
- A hidden recipe returns 404 for player and staff, and 200 for dm and superuser.
- An unknown or other-game recipe returns 404.
- `game_common_item_id` is validated on both tiers.
- A partial update changes only the given fields.
- Mass assignment and `X-Skip-Cache` are covered.

## Serializer unit tests

Cover the allowlist and the mass-assignment regression.

## Permissions

- `/permissions/game_recipe.json`: mirror `game_common_item_permissions_test.py`.
- Add `can_create_recipe` wherever the game permission flags are enumerated:
  - `game_permissions_test.py`
  - `builder_test.py`
  - `page_config_store_test.py`

## Files to Change

- `backend/games/tests/views/game/recipes/game_recipes_create_test.py` — new
- `backend/games/tests/views/game/recipes/game_recipe_detail_patch_test.py` — new
- `backend/games/tests/serializers/games/recipes/game_recipe_write_test.py` — new
- `backend/games/tests/views/permissions/game_recipe_permissions_test.py` — new
- `backend/games/tests/views/permissions/game_permissions_test.py` — add the flag
- `backend/permissions/tests/builder_test.py` — add the flag
- `backend/permissions/tests/page_config_store_test.py` — add the flag
