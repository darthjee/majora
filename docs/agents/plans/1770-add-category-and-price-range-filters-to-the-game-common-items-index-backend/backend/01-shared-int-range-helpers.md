# Shared int-range helpers

Add `filter_by_min(request, queryset, param, field)` and `filter_by_max(request, queryset,
param, field)` to `backend/common/query_filters.py`, plus a private `_filter_by_int` helper they
share. Read `request.query_params.get(param)`; return the queryset unchanged when the value is
`None` or `int(value)` raises `ValueError` (covers empty, non-numeric and decimal values, rules
#5–#7); otherwise apply `<field>__gte` / `<field>__lte`. Check `is None`, not falsiness, so `0`
and negative values are applied (rules #8–#9). Update the module docstring to mention the
int-range helpers.

Tests in `backend/common/tests/query_filters_test.py` (new `TestFilterByMin` / `TestFilterByMax`
classes, reusing the existing `Request(APIRequestFactory().get(...))` pattern): param absent,
empty value, non-numeric, decimal, `0`, negative, valid value, and a custom `param` name.

## Files to Change

- `backend/common/query_filters.py` — add `filter_by_min` / `filter_by_max`
- `backend/common/tests/query_filters_test.py` — add tests per `testing.md` › Shared helpers
