# Merge the sort error into the shared validation

The spec requires a bad `sort` to be reported **at once** with the shared param errors, e.g.
`?sort=x&tz=Nowhere` returns both `sort` and `tz`. `parse_statistics_filters(request)` currently
returns a ready `400` Response, so it cannot merge another error.

Extend it with an optional extra-errors argument, keeping current callers unchanged:

```python
def parse_statistics_filters(request, extra_errors=None):
    """Return `(filters, None)`, or `(None, 400 Response)` listing every invalid param."""
    filters, errors = StatisticsParamsParser(request.query_params).parse()
    errors = {**errors, **(extra_errors or {})}
    if errors:
        return None, Response({'errors': errors}, status=400)
    return filters, None
```

Add a small helper next to it:

```python
def parse_sort(request, choices, default):
    """Return `(sort, errors)`: an omitted `sort` is `default`, an empty or unknown one is `invalid_sort`."""
```

It returns `({'sort': ['invalid_sort']})` for an empty `sort=` or any value not in `choices`.
Without it, the view would duplicate this validation.

## Tests (in `backend/staff/tests/staff_statistics_shared_test.py`)
- `extra_errors` alone makes `parse_statistics_filters` return a `400`.
- `extra_errors` combined with a parser error lists both.
- `parse_sort`: an omitted value gives the default, a valid value is returned, and both an empty
  and an unknown value give `invalid_sort`.

## Files to Change
- `backend/staff/views/_staff_statistics_shared.py` — `extra_errors` parameter and `parse_sort` helper.
- `backend/staff/tests/staff_statistics_shared_test.py` — tests for both.
