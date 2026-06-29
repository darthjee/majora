# Frontend Plan: Fix Logoff

Main plan: [plan.md](plan.md)

## Shared contracts

**Endpoint:** `DELETE /users/logout.json`
- **Request:** `Authorization: Token <token>` header (required)
- **Success response:** `204 No Content`
- **Unauthenticated response:** `401 Unauthorized`
- **Wrong method (POST):** `405 Method Not Allowed`

## Implementation Steps

### Step 1 — Update AuthClient.logout to use DELETE

In `frontend/assets/js/client/AuthClient.js`, change the `logout` method so that `method` is `'DELETE'` instead of `'POST'`.

### Step 2 — Update the AuthClient spec

In `frontend/specs/assets/js/client/AuthClientSpec.js`, update the `#logout` describe block:
- Change the expected `method` from `'POST'` to `'DELETE'`.

### Step 3 — Run checks

Run:
```
docker-compose run --rm frontend yarn test
docker-compose run --rm frontend yarn lint
```

## Files to Change

- `frontend/assets/js/client/AuthClient.js` — change `method: 'POST'` to `method: 'DELETE'` in `logout()`
- `frontend/specs/assets/js/client/AuthClientSpec.js` — change expected `method: 'POST'` to `method: 'DELETE'` in the `#logout` spec

## CI Checks

- `frontend/`: `docker-compose run --rm frontend yarn test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm frontend yarn lint` (CI job: `frontend-checks`)

## Notes

- The `logout` method does not send a request body; only the `Authorization` header changes.
- No other frontend components or helpers need to be changed — `HeaderController.js` calls `AuthClient.logout()` unchanged.
