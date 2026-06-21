# Backend Plan: Add login modal

Main plan: [plan.md](plan.md)

## Shared contracts

- Add `GET /users/status.json`, `AllowAny`. Reads `Authorization: Token <value>` (DRF `TokenAuthentication` semantics) if present.
  - Token present and valid: `200 {"logged_in": true, "username": "<username>"}`.
  - Token missing or invalid: `200 {"logged_in": false}` (never `401` — this endpoint is informational, not an auth gate).
- `login.json`/`logout.json` already exist and are unchanged by this issue.

## Implementation Steps

### Step 1 — Add the `status` view
In `source/games/views/auth.py`, add a `status` view:

```python
from rest_framework.authentication import TokenAuthentication

@api_view(['GET'])
@permission_classes([AllowAny])
def status(request):
    """Report whether the requesting token (if any) is logged in."""
    auth = TokenAuthentication()
    try:
        result = auth.authenticate(request)
    except Exception:
        result = None

    if result is None:
        return Response({'logged_in': False})

    user, _ = result
    return Response({'logged_in': True, 'username': user.username})
```

### Step 2 — Route it
In `source/games/urls.py`, add:
```python
path('users/status.json', views.status, name='users-status'),
```

### Step 3 — Tests
In `source/games/tests/auth_test.py`, add a `TestStatusView` class covering:
- Valid token returns `200 {"logged_in": true, "username": ...}`.
- No `Authorization` header returns `200 {"logged_in": false}`.
- Invalid/garbage token returns `200 {"logged_in": false}` (not 401).

## Files to Change
- `source/games/views/auth.py` — add `status` view.
- `source/games/urls.py` — route `users/status.json`.
- `source/games/tests/auth_test.py` — add `TestStatusView`.

## CI Checks
- `source`: `poetry run pytest` (CI job: `pytest`)
- `source`: `poetry run ruff check .` (CI job: `checks`)

## Notes
- Keep the view thin per `AGENTS.md` conventions — all logic stays in the view itself here since there's no model/business logic involved.
