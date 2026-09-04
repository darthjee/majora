# Add the `force-expire` endpoint

Add `POST /staff/users/<int:user_id>/recovery-tokens/<int:token_id>/force-expire.json`, same
decorator stack and ownership check as the `unexpire` endpoint.

On success: set `invalidated_at = timezone.now()`, save, log `pk`/`user_id`/`action='force-expire'`/
acting staff id (never the raw `token`), and return `Response({})` with the default 200 status.

No token-state guard: force-expiring an already-expired, already-used, or already-revoked token is
allowed and always succeeds the same way (a no-op on the token's actual validity, but the request
still succeeds). Since `PasswordResetToken.is_valid()` already checks `invalidated_at is not None`,
this takes effect immediately for any concurrent `reset_password` attempt — no caching to
invalidate.

## Files to Change

- `backend/staff/views/staff_user_recovery_token_force_expire.py` — new view, per the shape above.
- `backend/staff/views/__init__.py` — export `staff_user_recovery_token_force_expire`.
- `backend/staff/urls.py` — register the new path as `staff-user-recovery-token-force-expire`.
- `backend/staff/tests/staff_user_recovery_token_force_expire_test.py` — new test file, mirroring
  `staff_user_recovery_link_test.py`'s setup and auth-matrix tests (401/403/404), plus:
  force-expiring a valid token sets `invalidated_at` and makes `is_valid()` return `False`;
  force-expiring an already-used or already-expired token still succeeds (200); a token belonging
  to a different user 404s; response body/status is `200 {}`.
