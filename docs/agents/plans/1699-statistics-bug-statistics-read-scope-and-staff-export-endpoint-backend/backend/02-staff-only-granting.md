# Staff-only granting

- `GET /account/api_tokens/options.json` lists the staff-only scopes only when the caller is admin
  or staff (`AdminOrStaffCache.is_admin_or_staff`).
- `ApiTokenCreateSerializer.validate_scopes` rejects a staff-only scope for a non-staff owner with
  a `400` `scope_staff_only` error. It is never silently stripped.
- Per-game restrictions on the token do not affect this scope (the export route has no
  `game_slug`, so `_game_allowed` already passes).

Tests: options for staff vs. non-staff; creation of a `statistics:read` token by staff (ok) and
non-staff (`400` `scope_staff_only`).

## Files to Change

- `backend/accounts/views/api_tokens/options.py` — filter staff-only scopes by caller.
- `backend/accounts/serializers/api_token/create.py` — `scope_staff_only` validation.
- `backend/accounts/tests/api_tokens/options_test.py` — staff / non-staff options.
- `backend/accounts/tests/api_tokens/list_create_test.py` and
  `backend/accounts/tests/serializers/api_token/create_test.py` — creation tests.
