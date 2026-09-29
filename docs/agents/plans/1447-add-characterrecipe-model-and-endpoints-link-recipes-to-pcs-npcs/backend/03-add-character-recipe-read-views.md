# Add PC/NPC recipe index and detail views

Mirror the possessions read stack:

- `backend/games/views/game/recipes/_character_recipes.py` (or the location
  `docs/agents/views-organization.md` prescribes). Model it on
  `views/game/possessions/_possessions.py`: add `character_recipes` and `character_recipe_detail`
  decorated with `@check_hidden`. Both use `character.character_recipes.select_related(
  'game_recipe', 'game_recipe__game_common_item')`, exclude `hidden=True` unless
  `allow_hidden`, and never filter on `GameRecipe.hidden` (E9). The index supports `?name=`, a
  case-insensitive substring match on `game_recipe__name`, and is paginated with
  `paginated_list_response`. The detail looks up `id=<character_recipe_id>` among that
  character's rows only, so another character's id returns `404`. On NPCs, set
  `X-Skip-Cache: true` when a hidden NPC is served through the gate, as the possessions helpers
  do.
- `backend/games/views/game/_character/recipes/_recipe_shared.py`: add the factories
  `build_recipes_view`, `build_recipes_all_view`, `build_recipe_detail_view` and
  `build_recipe_detail_full_view`, modeled on `_possession_shared.py`. The `all` and `full`
  variants call `_check_character_all_permission` (CharacterEdit on PCs, GameEdit on NPCs) and
  set `X-Skip-Cache: true`. On every variant, compute the output mask from
  `check_game_edit(request, game) is None` and pass it through the serializer context. Plain
  variants always mask.
- `views/game/pcs/detail/recipes/` and `views/game/npcs/detail/recipes/` (with `detail/`
  subfolders): add `game_pc_recipes`, `game_pc_recipes_all`, `game_pc_recipe_detail` and
  `game_pc_recipe_detail_full`, plus the NPC equivalents, built from the factories. Export them
  wherever the possession views are exported.
- `backend/games/urls/_character_routes.py`: add `('/recipes.json', 'recipes')`,
  `('/recipes/all.json', 'recipes_all')`,
  `('/recipes/<int:character_recipe_id>.json', 'recipe_detail')` and
  `('/recipes/<int:character_recipe_id>/full.json', 'recipe_detail_full')`.

Tests (PC and NPC), in `backend/games/tests/views/game/pcs|npcs/detail/recipes/...`, mirroring
the possession tests:

- Plain endpoints exclude hidden links and include a visible link to a hidden `GameRecipe` (E9).
- Masked output, and `?name=`.
- Detail returns `404` for a hidden, unknown, or other-character id.
- `all` / `full`: 401/403 for the wrong tier. The PC owner gets hidden rows with the output
  **masked**; the DM gets it unmasked.
- The hidden-NPC gate returns `404`. An incognito NPC has no effect.
- `X-Skip-Cache` headers.

## Files to Change

- `backend/games/views/game/recipes/_character_recipes.py`: shared list/detail helpers.
- `backend/games/views/game/_character/recipes/__init__.py` and `_recipe_shared.py`: factories.
- `backend/games/views/game/pcs/detail/recipes/**` and
  `backend/games/views/game/npcs/detail/recipes/**`: concrete views.
- The views package `__init__` modules that export the PC/NPC possession views: new exports.
- `backend/games/urls/_character_routes.py`: 4 routes.
- `backend/games/tests/views/game/pcs/detail/recipes/**` and `.../npcs/detail/recipes/**`: tests.
