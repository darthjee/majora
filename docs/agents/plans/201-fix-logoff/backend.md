# Backend Plan: Fix Logoff

Main plan: [plan.md](plan.md)

## Shared contracts

**Endpoint:** `DELETE /users/logout.json`
- **Request:** `Authorization: Token <token>` header (required)
- **Success response:** `204 No Content` — token is deleted, session is flushed
- **Unauthenticated response:** `401 Unauthorized`
- **Wrong method (POST):** `405 Method Not Allowed`

## Implementation Steps

### Step 1 — Change the allowed HTTP method in the logout view

In `source/games/views/auth.py`, change the `@api_view` decorator on the `logout` function from `['POST']` to `['DELETE']`. No other changes to the view logic are needed — the authentication and token-deletion logic is correct.

### Step 2 — Update backend tests

In `source/games/tests/auth_test.py`, update the `TestLogoutView` class:

- In every test that calls `client.post('/users/logout.json', ...)`, change it to `client.delete('/users/logout.json', ...)`.
- Add a test asserting that `POST /users/logout.json` returns `405 Method Not Allowed`.

### Step 3 — Run checks

Run:
```
docker-compose run --rm backend poetry run pytest source/games/tests/auth_test.py
```

## Files to Change

- `source/games/views/auth.py` — change `@api_view(['POST'])` to `@api_view(['DELETE'])` on the `logout` function
- `source/games/tests/auth_test.py` — update all `client.post` calls in `TestLogoutView` to `client.delete`; add a test for `405` on POST

## CI Checks

- `source/`: `docker-compose run --rm backend poetry run pytest` (CI job: `pytest`)

## Notes

- The URL registration in `source/games/urls.py` does not need to change — `path('users/logout.json', views.logout, ...)` is method-agnostic.
- No migration is needed.
