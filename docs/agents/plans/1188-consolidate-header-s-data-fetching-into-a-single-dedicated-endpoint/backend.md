# Backend Plan: Consolidate Header's data-fetching into a single dedicated endpoint

Main plan: [plan.md](plan.md)

## Shared contracts

Produces `GET /users/header_status.json` — see [plan.md](plan.md)'s Shared contracts table for the exact response shape, headers, and access rules. In short:

- `AllowAny`, always `HTTP 200`.
- `X-Skip-Cache: true` set unconditionally (mandatory — identity-dependent response).
- Body mirrors `status.py`'s existing `_build_payload`/`_build_logged_in_payload` shape: `{"logged_in": bool}` when anonymous/denied, `{"logged_in": false, "status": "pending"}` when pending, otherwise `{"logged_in": true, "is_superuser": bool, "is_staff": bool, "cache_token": str}`.
- Reuse the existing resolution helpers rather than reimplementing `UserProfile.status` gating or `CacheToken.get_or_create` — see Implementation Steps below.

## Implementation Steps

### Step 1 — Add the new view, reusing `status.py`'s resolution logic

`backend/accounts/views/auth/status.py` already has `_build_payload(request)` (pending/denied/anonymous short-circuit) and `_build_logged_in_payload(request)` (the full branch: `is_superuser`, `is_staff`, `username`, `settings`, `cache_token`, minting `CacheToken` via `get_or_create`). Add a new view (e.g. `backend/accounts/views/auth/header_status.py`) that calls the same underlying payload-building logic and returns only the subset Header needs (`logged_in`, `status`, `is_superuser`, `is_staff`, `cache_token`) — do not re-derive `UserProfile.status` gating or re-implement `CacheToken` minting.

If `_build_payload`/`_build_logged_in_payload` are private enough (leading underscore) that importing them from another module feels wrong, extract the shared logic into a small importable helper (e.g. a `resolve_status(request)` function in a shared module both `status.py` and the new view import from) rather than duplicating the branching. Judgment call — either approach is acceptable as long as the branching logic has one source of truth.

Set `X-Skip-Cache: true` on the response the same way `access.json` views do (see `docs/agents/access-control/common-rules.md`'s "Cache-bypass mechanism for access endpoints" for the exact convention).

### Step 2 — Wire the URL route

Add `path('users/header_status.json', views.header_status, name='header_status')` (or equivalent) to `backend/accounts/urls/auth.py`, alongside the existing `status` route at line 11. No proxy rule changes needed — confirmed the Tent proxy's generic `.json` catch-all (`proxy/*/rules/backend.php`) already routes any new `*.json` path to Django.

### Step 3 — Tests

Add tests alongside `backend/accounts/tests/auth/status_test.py` (new file, e.g. `backend/accounts/tests/auth/header_status_test.py`), covering:
- Anonymous request → `200 {"logged_in": false}`.
- Pending-profile request → `200 {"logged_in": false, "status": "pending"}`, no `is_staff`/`is_superuser`/`cache_token` present.
- Denied-profile request → same as anonymous.
- Approved, non-staff/non-superuser → `200` with `is_staff: false`, `is_superuser: false`, `cache_token` present and minted.
- Approved staff/superuser → `is_staff`/`is_superuser` reflect `request.user`'s real flags.
- Response has `X-Skip-Cache: true`.
- Repeated calls for the same already-`CacheToken`'d user return the same token (i.e. `get_or_create`, not re-minting a new one each time) — mirrors `status_test.py`'s existing coverage of this for `/users/status.json`, if present.

### Step 4 — Update access-control docs

Add a row for `/users/header_status.json` to `docs/agents/access-control/endpoints.md`'s "Authentication endpoints" table, immediately following the existing `/users/status.json` row, noting that it deliberately reuses the same access rules and resolution logic (`AllowAny`, same `UserProfile.status` gate, same `CacheToken` minting) but returns a narrower field set for `Header`'s exclusive use. This is a required repo convention (`docs/agents/access-control.md`: "when a new model or endpoint is introduced, update the relevant file... in the same PR"), not optional cleanup.

## Files to Change

- `backend/accounts/views/auth/status.py` — possibly extract shared resolution helper (Step 1, judgment call)
- `backend/accounts/views/auth/header_status.py` — new view (Step 1)
- `backend/accounts/urls/auth.py` — new route (Step 2)
- `backend/accounts/tests/auth/header_status_test.py` — new tests (Step 3)
- `docs/agents/access-control/endpoints.md` — new endpoint row (Step 4)

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`) — covers `accounts/tests/`
- `backend`: `poetry run ruff check .` and `bin/reports.sh ci` (CI job: `checks`)

## Notes

- Endpoint path (`/users/header_status.json`) is a proposed default, not a hard requirement — if a different name/location is chosen during implementation, update [plan.md](plan.md)'s Shared contracts and flag it to whoever implements the frontend side so both stay in sync.
- `AccessStore.ensureStaffOrSuperUser()`/`AccessStoreAdmin` and its `/users/status.json` calls are explicitly untouched — do not modify `status.py`'s existing view/route/response shape, only add new code alongside it.
