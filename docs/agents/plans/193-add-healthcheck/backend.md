# Backend Plan: Add Healthcheck

Main plan: [plan.md](plan.md)

## Shared contracts

This agent must implement the public endpoint that the frontend polls:

- `GET /health.json` → HTTP 200, body `{"status": "ok"}`
- No authentication required (`AllowAny` permission class, empty `authentication_classes`)

## Implementation Steps

### Step 1 — Add the health view

Create `source/games/views/health.py` with a single function-based view:

```python
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def health(request):
    """Return a simple health check response."""
    return Response({'status': 'ok'})
```

### Step 2 — Export the view from the `views` package

Add `health` to the `__init__.py` of `source/games/views/` so that the URL config can
import it via `from . import views`.

### Step 3 — Register the URL

In `source/games/urls.py`, add:

```python
path('health.json', views.health, name='health'),
```

Place it near the other utility routes (e.g. after the `users/` routes at the bottom).

### Step 4 — Write tests

Create `source/games/tests/views/health_test.py` following the same pattern as
`auth_test.py` (using `pytest.mark.django_db`, `client.get(...)`, checking status code
and JSON body):

- `test_returns_200` — `GET /health.json` returns 200.
- `test_returns_status_ok` — response body is `{"status": "ok"}`.
- `test_does_not_require_authentication` — unauthenticated request (no token, no session)
  still returns 200.

## Files to Change

- `source/games/views/health.py` — new file, health view
- `source/games/views/__init__.py` — export `health`
- `source/games/urls.py` — register `health.json` route
- `source/games/tests/views/health_test.py` — new file, view tests

## CI Checks

- `source/`: `docker-compose run majora_be poetry run pytest` (CI job: `pytest`)

## Notes

- No migration is needed — this view has no database interaction.
- The endpoint is intentionally public; no auth headers should be required.
