# Add the game recipe views and routes

Following `docs/agents/views-organization.md`, create `backend/games/views/game/recipes/`:

- `game_recipes.py` — `GET /games/<slug>/recipes.json`, AllowAny. `game.recipes.filter(hidden=False)`
  with `select_related('game_common_item__photo')`, the category filter, then
  `paginated_list_response` with `GameRecipeListSerializer`. GET only for now; #1446 adds POST to
  the same view.
- `game_recipes_all.py` — `GET /games/<slug>/recipes/all.json`. `check_game_edit`, all recipes,
  the category filter on the real category, `GameRecipeAllListSerializer`,
  `X-Skip-Cache: true`.
- `game_recipe_detail.py` — `GET /games/<slug>/recipes/<int:recipe_id>.json`, AllowAny. `404` if
  the recipe is hidden, unknown or in another game. Uses `GameRecipeDetailSerializer`.
- `detail/game_recipe_detail_full.py` — `GET /games/<slug>/recipes/<int:recipe_id>/full.json`.
  `check_game_edit`, then `GameRecipeDetailFullSerializer`, `X-Skip-Cache: true`.

Shared category filter, e.g. `_recipe_filters.py`:

```python
def filter_by_category(request, queryset, mask_hidden_output):
    category = request.query_params.get('category')
    if category is None:
        return queryset
    if category not in {value for value, _ in GameCommonItem.CATEGORY_CHOICES}:
        return queryset.none()
    queryset = queryset.filter(game_common_item__category=category)
    if mask_hidden_output:
        queryset = queryset.filter(game_common_item__hidden=False)
    return queryset
```

Route the four URLs in `backend/games/urls/games.py`, importing the views directly from their
submodule. Put `recipes/all.json` before `recipes/<int:recipe_id>.json`.

Tests under `backend/games/tests/views/game/recipes/`, one file per view:

- Plain index: hidden recipes excluded, masked output (`null`), no `hidden` key, pagination and
  ordering by `id`, and no `X-Skip-Cache`.
- Category filter on the plain index: a matching category, a masked recipe never matching, an
  unknown value returning an empty list, and masked recipes still listed when unfiltered.
- `all.json`: `401` / `403` (player, anonymous), DM success with hidden recipes, the `hidden`
  key, the real output, filtering on the real category (hidden output matches) and
  `X-Skip-Cache: true`.
- Plain detail: `404` for hidden, unknown and other-game recipes, the detail fields, masked
  output.
- `full.json`: `401` / `403`, returns hidden recipes, `hidden` and the real output,
  `X-Skip-Cache: true`.

## Files to Change

- `backend/games/views/game/recipes/__init__.py`, `_recipe_filters.py`, `game_recipes.py`,
  `game_recipes_all.py`, `game_recipe_detail.py`, `detail/__init__.py`,
  `detail/game_recipe_detail_full.py` — new views
- `backend/games/urls/games.py` — four routes
- `backend/games/tests/views/game/recipes/**_test.py` — tests
