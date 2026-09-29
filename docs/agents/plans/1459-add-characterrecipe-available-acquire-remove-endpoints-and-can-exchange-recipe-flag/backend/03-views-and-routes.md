# View builders, per-character views and routes

In `games/views/game/_character/recipes/_recipe_shared.py`, add a helper and builders.

**Helper:** `_check_exchange_access(request, game, character_id, npc)`:

1. On NPCs, run the hidden-NPC gate first (as `_check_restricted_access` does).
2. Then run `EndpointPermission(request.user, game=game, pc=character).check(request,
   _character_recipe_resource(character), 'regular', 'create')`.

**Builders:** each is `@_build_api_view([...], AllowAny)`, parameterized by `npc`, and wraps
its response in `_skip_cache`.

| Builder | Method | Gate | Calls |
|---------|--------|------|-------|
| `build_recipes_available_view` | GET | `_check_exchange_access` | `character_recipes_available(..., serializer_class=GameRecipeListSerializer)` |
| `build_recipes_available_all_view` | GET | NPC hidden gate, then `check_game_edit` | `allow_hidden=True, serializer_class=GameRecipeAllListSerializer` |
| `build_recipe_acquire_view` | POST | `_check_exchange_access` | `character_recipe_acquire` (plain shape) |
| `build_recipe_acquire_all_view` | POST | NPC hidden gate, then `check_game_edit` | `allow_hidden=True` (full shape, unmasked) |
| `build_recipe_remove_view` | POST | `_check_exchange_access` | `character_recipe_remove` |
| `build_recipe_remove_all_view` | POST | `_check_restricted_access` (CharacterEdit for PC, GameEdit for NPC) | `allow_hidden=True` |

Factor the "NPC hidden gate, then `check_game_edit`" sequence into a small helper, for example
`_check_game_edit_access`. Error responses (401/403/404) also carry `X-Skip-Cache`, as the
existing `_skip_cache` / `skip_cache` usage in this module does.

**Per-character modules:** add one module per view under
`games/views/game/pcs/detail/recipes/` and `games/views/game/npcs/detail/recipes/`, following the
document layout:

- `game_<kind>_recipes_available.py`
- `game_<kind>_recipes_available_all.py`
- `detail/game_<kind>_recipe_acquire.py`
- `detail/game_<kind>_recipe_acquire_all.py`
- `detail/game_<kind>_recipe_remove.py`
- `detail/game_<kind>_recipe_remove_all.py`

Export each one through the package `__init__.py` chain up to `games.views`, the same way the
document views are exported, since `build_character_urlpatterns` resolves
`views.game_<kind>_<suffix>`.

**Routes:** in `games/urls/_character_routes.py`, add the following after `recipe_detail_full`:

- `('/recipes/available.json', 'recipes_available')`
- `('/recipes/available/all.json', 'recipes_available_all')`
- `('/recipes/acquire.json', 'recipe_acquire')`
- `('/recipes/acquire/all.json', 'recipe_acquire_all')`
- `('/recipes/remove.json', 'recipe_remove')`
- `('/recipes/remove/all.json', 'recipe_remove_all')`

The literal paths do not clash with `<int:character_recipe_id>.json`, but order them before the
int routes anyway, as documents does.

## Files to Change
- `backend/games/views/game/_character/recipes/_recipe_shared.py` — new access helpers and six builders
- `backend/games/views/game/pcs/detail/recipes/` — `game_pc_recipes_available.py`, `game_pc_recipes_available_all.py`, `__init__.py`
- `backend/games/views/game/pcs/detail/recipes/detail/` — `game_pc_recipe_acquire.py`, `game_pc_recipe_acquire_all.py`, `game_pc_recipe_remove.py`, `game_pc_recipe_remove_all.py`, `__init__.py`
- `backend/games/views/game/npcs/detail/recipes/` and `detail/` — NPC equivalents
- `backend/games/views/game/pcs/__init__.py`, `npcs/__init__.py`, `games/views/game/__init__.py` (and any intermediate `__init__`) — exports
- `backend/games/urls/_character_routes.py` — six routes
