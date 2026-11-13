# Wire both views

In `game_common_items.py` (GET branch) and `game_common_items_all.py`, replace the
`filter_by_name` call with `apply_common_item_filters` on the same base queryset
(`game.common_items.filter(hidden=False)` for the public index, `game.common_items.all()` for
`all.json`), before `paginated_list_response` (rules #11, #13). Update both docstrings to list the
four optional params. Nothing else changes (serializers, `X-Skip-Cache`, ordering, POST branch).

View tests in `game_common_items_test.py` and `game_common_items_all_test.py`, for both
endpoints: each filter alone (`name`, `category`, `min_price`, `max_price`); combinations;
`min_price > max_price` → empty list (#10); unknown category → 200 with empty list (#1);
non-numeric price ignored (#5); `min_price=0` applied (#9); a hidden item matching the filters is
absent from the public index but present in `all.json` (#11); pagination headers reflect the
filtered total (#13); unknown params ignored (#14).

## Files to Change

- `backend/games/views/games/game_common_items.py` — use `apply_common_item_filters`
- `backend/games/views/games/game_common_items_all.py` — use `apply_common_item_filters`
- `backend/games/tests/views/games/game_common_items_test.py` — filter tests
- `backend/games/tests/views/games/game_common_items_all_test.py` — filter tests
