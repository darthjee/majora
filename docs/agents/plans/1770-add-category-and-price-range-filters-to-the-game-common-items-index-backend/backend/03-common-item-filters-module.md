# Common items filters module

Create `backend/games/views/games/_common_item_filters.py`, mirroring
`game/recipes/_recipe_filters.py`:

- `filter_by_category(request, queryset)`: read `request.query_params.get('category')` (last
  value wins for a repeated param, rule #4); `None` or `''` → unchanged (rule #2); value not in
  `GameCommonItem.CATEGORY_CHOICES` (exact, case-sensitive, rule #3) → `queryset.none()` (rule
  #1); otherwise `queryset.filter(category=value)`.
- `apply_common_item_filters(request, queryset)`: `filter_by_name` → `filter_by_category` →
  `filter_by_min(request, qs, 'min_price', 'price')` → `filter_by_max(request, qs, 'max_price',
  'price')`.

Tests in `backend/games/tests/views/games/common_item_filters_test.py`: `filter_by_category`
for unknown, empty, wrong-case, repeated and valid values; `apply_common_item_filters` for the
AND combination of all four filters and for no params (queryset unchanged).

## Files to Change

- `backend/games/views/games/_common_item_filters.py` — new module
- `backend/games/tests/views/games/common_item_filters_test.py` — new tests
