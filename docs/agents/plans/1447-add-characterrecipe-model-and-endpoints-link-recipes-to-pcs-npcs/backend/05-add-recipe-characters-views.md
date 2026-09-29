# Add recipe → characters views

Model this on `backend/games/views/games/game_faction_characters.py` and its `_all` sibling:

- `GET /games/<slug>/recipes/<id>/characters.json` (AllowAny):
  - returns `404` if the `GameRecipe` is unknown, belongs to another game, or is hidden;
  - lists characters (PCs and NPCs) through `CharacterRecipe` rows with `hidden=False`;
  - excludes hidden NPCs and incognito NPCs;
  - is ordered by character `name`, then `id`, and paginated;
  - does not set `X-Skip-Cache`.
- `GET /games/<slug>/recipes/<id>/characters/all.json` (GameEdit via `check_game_edit`):
  - works for a hidden recipe;
  - includes hidden links and hidden or incognito NPCs;
  - each entry adds `hidden` (the `CharacterRecipe.hidden` value);
  - sets `X-Skip-Cache: true`.
- Entry `id` is the character id. Both endpoints reuse the `game_recipe` read tiers and add no
  `endpoints.yml` keys.
- Put the views in the recipes view folder (`views/game/recipes/detail/` per
  `views-organization.md`) and register both routes in `backend/games/urls/games.py` next to the
  existing recipe routes.

Tests:

- 404 for a hidden, unknown, or other-game recipe.
- Hidden links, hidden NPCs and incognito NPCs are excluded.
- PCs and NPCs appear mixed.
- Ordering and pagination.
- `all`: 401/403, includes everything, `hidden` field, headers.

## Files to Change

- `backend/games/views/game/recipes/detail/game_recipe_characters.py` and
  `game_recipe_characters_all.py`: views.
- `backend/games/views/game/recipes/detail/__init__.py` and `backend/games/views/game/recipes/__init__.py`:
  exports.
- `backend/games/urls/games.py`: 2 routes.
- `backend/games/tests/views/game/recipes/detail/game_recipe_characters_test.py` and
  `game_recipe_characters_all_test.py`: tests.
