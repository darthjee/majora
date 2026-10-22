# Recipes

Declare scopes on the recipe views. Recipes embed their output common item, so the routes that
can expose a hidden output also need `common_items:read`.

| View | Declaration |
|---|---|
| `game_recipes` | `GET=[]`, `POST=['recipes:write', 'common_items:read']` |
| `game_recipes_all` | `GET=['recipes:read', 'common_items:read']` |
| `game_recipe_detail` | `GET=[]`, `PATCH=['recipes:write', 'common_items:read']` |
| `game_recipe_detail_full` | `GET=['recipes:read', 'common_items:read']` |
| `game_recipe_characters` | `GET=[]` |
| `game_recipe_characters_all` | `GET=['recipes:read', 'pcs:read', 'npcs:read']` |
| `game_recipe_permissions` | `GET=[]` |

Tests: public reads without scopes → 200; `recipes/all.json` / `full.json` with only
`recipes:read` → `scope_missing`, with `recipes:read` + `common_items:read` → 200;
`characters/all.json` missing any of `recipes:read` / `pcs:read` / `npcs:read` →
`scope_missing`, with all three → 200; POST/PATCH with only `recipes:write` → `scope_missing`,
with `recipes:write` + `common_items:read` → success; wrong game → `game_not_allowed`; a player
token (regular-tier writer per `game_recipe/endpoints.yml`) can still create with the scopes, but
a player token on `all.json` gets the owner's role refusal.

## Files to Change
- `backend/games/views/game/recipes/game_recipes.py`, `game_recipes_all.py`, `game_recipe_detail.py` — add `@token_scopes`
- `backend/games/views/game/recipes/detail/game_recipe_detail_full.py`, `game_recipe_characters.py`, `game_recipe_characters_all.py` — add `@token_scopes`
- `backend/games/views/permissions/game_recipe_permissions.py` — add `@token_scopes(GET=[])`
- `backend/games/tests/views/game/recipes/recipes_token_scopes_test.py` — new
