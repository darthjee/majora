# Backend Plan: Remove periodic health check

Main plan: [plan.md](plan.md)

## Shared contracts

Remove the `/health.json` endpoint entirely — it will 404 after this change. No response shape needs to be preserved; the frontend agent is removing every caller of it independently.

## Implementation Steps

### Step 1 — Remove the health view

Delete `backend/games/views/health.py`. Remove its import (`from .health import health`) and its `'health'` entry from the `__all__`-style export list in `backend/games/views/__init__.py`.

### Step 2 — Remove the URL registration

In `backend/games/urls/system.py`, remove the `path('health.json', views.health, name='health'),` line. Leave `ready.json` and `access-route-config.json` untouched — they are unrelated system endpoints.

### Step 3 — Remove the middleware special-case

In `backend/games/middleware.py` (`CacheControlMiddleware.__call__`), remove the block:

```python
# Do not add Cache-Control to the health check endpoint.
if request.path.endswith('/health.json'):
    return response
```

Also update the class docstring, which lists "Skips the health check endpoint (`/health.json`)." as one of the middleware's behaviors — drop that bullet.

### Step 4 — Remove backend tests

- Delete `backend/games/tests/views/health_test.py` entirely (it only tests the now-removed view).
- In `backend/games/tests/middleware_test.py`, remove the `TestCacheControlMiddlewareHealthCheck` class (the `test_no_cache_control_for_health_endpoint` test), since the endpoint it exercises no longer exists.

## Files to Change

- `backend/games/views/health.py` — delete
- `backend/games/views/__init__.py` — drop the `health` import and export
- `backend/games/urls/system.py` — drop the `health.json` route
- `backend/games/middleware.py` — drop the health-check skip branch and its docstring bullet
- `backend/games/tests/views/health_test.py` — delete
- `backend/games/tests/middleware_test.py` — drop `TestCacheControlMiddlewareHealthCheck`

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job: `pytest_views_rest`) — covers the deleted `health_test.py`
- `backend`: `poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all`) — covers `middleware_test.py`
- `backend`: `poetry run ruff check .` (CI job: `checks`) — lint after the edits

## Notes

- `ready.json` (readiness) is a separate, unrelated endpoint in the same `urls/system.py` file — do not touch it.
- No other backend module references `/health.json` (confirmed via a repo-wide search), so no further cleanup is expected beyond the files listed above.
