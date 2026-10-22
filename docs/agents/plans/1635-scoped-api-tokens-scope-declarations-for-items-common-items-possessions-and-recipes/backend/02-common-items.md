# Common items

Declare scopes on the common-items views, including the reverse common item → recipes listings.

| View | Declaration |
|---|---|
| `game_common_items` | `GET=[]`, `POST=['common_items:write']` |
| `game_common_items_all` | `GET=['common_items:read']` |
| `game_common_item_detail` | `GET=[]`, `PATCH=['common_items:write']` |
| `game_common_item_detail_full` | `GET=['common_items:read']` |
| `game_common_item_photo_upload` | `POST=['common_items:write']` |
| `game_common_item_recipes` | `GET=[]` |
| `game_common_item_recipes_all` | `GET=['common_items:read', 'recipes:read']` |
| `game_common_item_permissions` | `GET=[]` |

Tests: same matrix as step 01, plus the multi-family read: `common_items/<id>/recipes/all.json`
with only `common_items:read` (or only `recipes:read`) → `scope_missing`; with both → 200.

## Files to Change
- `backend/games/views/games/game_common_items.py`, `game_common_items_all.py`, `game_common_item_detail.py`, `game_common_item_detail_full.py`, `game_common_item_photo_upload.py` — add `@token_scopes`
- `backend/games/views/game/common_items/detail/game_common_item_recipes.py`, `game_common_item_recipes_all.py` — add `@token_scopes`
- `backend/games/views/permissions/game_common_item_permissions.py` — add `@token_scopes(GET=[])`
- `backend/games/tests/views/game/common_items/common_items_token_scopes_test.py` — new
