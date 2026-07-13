# Backend Plan: Wait for the system to be ready for recovery

Main plan: [plan.md](plan.md)

## Shared contracts

- Must implement `GET /ready.json`: public (`AllowAny`, no auth classes), returns `200` with
  body `{"status": "ok"}` on success, and always sets the response header
  `X-Skip-Cache: true`.
- The frontend and Tent proxy rely on this being reachable at the literal path `/ready.json`
  (routed the same way `/health.json` is today — no new proxy rule needed since `.json`
  paths already forward to the backend).

## Implementation Steps

### Step 1 — Add the `ready` view

Create `source/games/views/ready.py`, mirroring `source/games/views/health.py`:

```python
"""Readiness check view."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@authentication_classes([])
# Public endpoint: returns static status data only; no authentication required.
@permission_classes([AllowAny])
def ready(request):
    """Return a readiness check response, always bypassing cache."""
    response = Response({'status': 'ok'})
    response['X-Skip-Cache'] = 'true'
    return response
```

Note the difference from `health`: `ready` explicitly sets `response['X-Skip-Cache'] = 'true'`
(the generic pattern already used in `source/games/views/common.py`'s `access_response`),
rather than relying on `health.json`'s hardcoded middleware path-skip in
`source/games/middleware.py`. This makes `/ready.json` reusable for future readiness-gating
needs without requiring further middleware changes.

### Step 2 — Export and route the view

- `source/games/views/__init__.py`: import `ready` from `.ready` and add it to `__all__`,
  mirroring the existing `health` entries (lines ~43, ~113).
- `source/games/urls.py`: add `path('ready.json', views.ready, name='ready')` near the
  existing `path('health.json', views.health, name='health')` (line ~192).

### Step 3 — Tests

Add `source/games/tests/views/ready_test.py`, mirroring
`source/games/tests/views/health_test.py`:
- `GET /ready.json` returns `200` with body `{"status": "ok"}`.
- No authentication is required.
- Response includes header `X-Skip-Cache: true`.

Optionally extend `source/games/tests/middleware_test.py`
(`TestCacheControlMiddlewareSkipCache`-style case) to assert `Cache-Control: no-store` is
emitted for `/ready.json`, confirming the generic `X-Skip-Cache`-response-header → middleware
path works end to end (no `middleware.py` code changes needed).

## Files to Change

- `source/games/views/ready.py` — new readiness view.
- `source/games/views/__init__.py` — export `ready`.
- `source/games/urls.py` — route `ready.json`.
- `source/games/tests/views/ready_test.py` — new tests.
- `source/games/tests/middleware_test.py` — optional additional case for `/ready.json`
  cache-control behavior.

## CI Checks

- `source/`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/characters/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`)
- `source/`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- Keep the view thin, per project convention — no business logic beyond returning the static
  status and cache header.
- No DB/migration-status checks are in scope for this issue; `/ready.json` mirrors
  `/health.json`'s "just return 200" behavior for now, differing only in the cache-header
  mechanism (this is what makes it reusable/independent from `/health.json`'s hardcoded
  middleware skip).
