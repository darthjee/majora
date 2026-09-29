# Add the common item → recipes views and routes

These are member actions on a common item, so per `docs/agents/views-organization.md` they live in
`backend/games/views/game/common_items/detail/`:

- `game_common_item_recipes.py` — `GET /games/<slug>/common_items/<int:common_item_id>/recipes.json`,
  AllowAny. `404` if the common item is hidden, unknown or in another game (same lookup as
  `game_common_item_detail`). Lists `common_item.recipes.filter(hidden=False)`, paginated,
  ordered by `id`, with `GameRecipeListSerializer`. The output is never masked because the item
  is visible. No `?category=` filter and no `X-Skip-Cache`.
- `game_common_item_recipes_all.py` — `GET .../common_items/<int:common_item_id>/recipes/all.json`.
  `check_game_edit` first, then the common item looked up among **all** of the game's items (a
  hidden item works), all its recipes, `GameRecipeAllListSerializer`, `X-Skip-Cache: true`.

Add both routes to `backend/games/urls/games.py`, next to the existing `common_items` routes.

Tests under `backend/games/tests/views/game/common_items/detail/`:

- Plain: `404` for a hidden, unknown or other-game common item, hidden recipes excluded, only
  recipes producing that item, output present, pagination, and `?category=` ignored.
- `all.json`: `401` / `403`, works for a hidden common item, includes hidden recipes with
  `hidden`, `X-Skip-Cache: true`.

## Files to Change

- `backend/games/views/game/common_items/__init__.py`, `detail/__init__.py`,
  `detail/game_common_item_recipes.py`, `detail/game_common_item_recipes_all.py` — new views
- `backend/games/urls/games.py` — two routes
- `backend/games/tests/views/game/common_items/detail/*_test.py` — tests
