# Backend page

Create `docs/agents/specs/common-items-filters/backend.md`, recording the issue's *Helper refactor* decision:

- **Shared helpers:** `filter_by_min(request, queryset, param, field)` / `filter_by_max(request, queryset, param, field)` in `backend/common/query_filters.py`, reading `request.query_params`. Parsing: absent, empty or non-`int` value is ignored; `0` and negatives are applied (rules #5 to #9).
- **Treasure compatibility:** `backend/games/views/games/_treasure_filters.py` keeps `filter_by_min_value` / `filter_by_max_value` / `filter_by_name` with the same signatures, as thin wrappers; its 8 callers (4 treasure views, 4 exchange views) don't change; its docstring points to `common/query_filters.py`. Explain the pitfall this solves: the old helpers hard-code the `min_value` / `max_value` param names.
- **Common items module:** new `backend/games/views/games/_common_item_filters.py` with `filter_by_category(request, queryset)` (rules #1 to #4; kept local, with the reason) and `apply_common_item_filters(request, queryset)` (name → category → price range).
- **Views:** `game_common_items.py` and `game_common_items_all.py` call `apply_common_item_filters` once on their base queryset.
- **Not touched:** the recipes `category` filter (`backend/games/views/game/recipes/_recipe_filters.py`), and why.
- **Cache:** one line: no Navi change; `navi/resources/common_items.yml` warms only unfiltered pages, filtered URLs are plain cache misses.
- **Docs to update in #1770:** `docs/agents/access-control/game-common-item.md` (the `?name=` filter section).

## Files to Change

- `docs/agents/specs/common-items-filters/backend.md`: new page.
