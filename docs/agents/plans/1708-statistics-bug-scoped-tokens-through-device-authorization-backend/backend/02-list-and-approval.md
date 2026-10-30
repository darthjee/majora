# Expose scopes and check them on approval

- **List:** add `scopes` to `AuthorizationRequestListSerializer.Meta.fields`. The values are
  the stored, already-validated catalogue strings; the #1700 screen renders their labels.
- **Approval** (`authorize.py`): after the open/expired checks and the password check, if the
  request's scopes intersect `STAFF_ONLY_SCOPES` and `may_hold_staff_scopes(request.user)` is
  false, return `400 {"errors": {"scopes": ["scope_staff_only"]}}` (skip-cache) and leave the
  request `open` (no save), so the user can still deny it. Plain requests are unchanged.

Tests: the list returns `scopes` (`[]` for a plain request); staff approves a
`statistics:read` request (`202`, status `approved`); non-staff gets `400 scope_staff_only` and
the request stays `open`; non-staff approves a request with only non-staff scopes (`202`);
existing approval tests unchanged.

## Files to Change

- `backend/accounts/serializers/authorization_request/list.py` — `scopes` field.
- `backend/accounts/views/authorization_requests/authorize.py` — staff-only scope check.
- `backend/accounts/tests/authorization_requests/list_test.py`, `authorize_test.py` — tests.
