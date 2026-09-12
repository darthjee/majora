# Backend Plan: Backend: miniatures import endpoints return 200 on create as well as update

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Always return 200 from the two import views

In both `backend/miniatures/views/collection_import.py` and
`backend/miniatures/views/stl_model_import.py`, drop the
`serializer.created`-driven status branch and return `200` unconditionally.
Response body (`CollectionDetailSerializer` / `StlModelDetailSerializer`) and the
`skip_cache(...)` wrapper are unchanged; auth (`IsAuthenticated` + `require_staff`)
is unchanged. Update each view's docstring, which currently documents the 201/200
split, to say both create and update return 200.

Before:
```python
status = 201 if serializer.created else 200
return skip_cache(Response(detail.data, status=status))
```
After:
```python
return skip_cache(Response(detail.data, status=200))
```

### Step 2 — Update the view tests to expect 200 on create

In `backend/miniatures/tests/views/collection_import_test.py` and
`backend/miniatures/tests/views/stl_model_import_test.py`:
- `test_returns_201_on_create` → rename to `test_returns_200_on_create` and assert
  `response.status_code == 200`.
- `test_staff_can_import` currently asserts `201` (it hits the create path); change
  its assertion to `200`.
- `test_returns_200_on_update` and every other test (401/403/400, detail-shape,
  `X-Skip-Cache` header) are unaffected — leave as-is.

## Files to Change

- `backend/miniatures/views/collection_import.py` — always return 200; update docstring.
- `backend/miniatures/views/stl_model_import.py` — always return 200; update docstring.
- `backend/miniatures/tests/views/collection_import_test.py` — create-path assertions now expect 200.
- `backend/miniatures/tests/views/stl_model_import_test.py` — create-path assertions now expect 200.

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- No serializer or model changes — `serializer.created` remains available on the
  serializer for any other caller; only these two views stop branching on it.
- `crawler/navi_config.yaml` and the per-collection resource template already set
  `emit.status: 200` and need no change (this is the reason the backend fix was
  chosen over a crawler-side one).
