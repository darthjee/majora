# Add the `unexpire` endpoint

Add `POST /staff/users/<int:user_id>/recovery-tokens/<int:token_id>/unexpire.json`, mirroring
`staff_user_recovery_link`'s decorator stack exactly (`@restricted` + `@api_view(['POST'])` +
`@permission_classes([AllowAny])`, `require_staff(request)` first, then
`get_object_or_404(PasswordResetToken, pk=token_id, user_id=user_id)`).

On success: set `invalidated_at = None` and `expires_at = timezone.now() + timedelta(minutes=Settings.password_reset_token_expiration_minutes())`
(reuse the same helper `PasswordResetToken._default_expires_at()` already calls — either call it
directly if it's importable/reusable as-is, or inline the identical computation), save, log
`pk`/`user_id`/`action='unexpire'`/acting staff id (never the raw `token`), and return `Response({})`
with the default 200 status. Never touch `used_at`.

No token-state guard: calling this on an already-valid, used, or already-invalidated token is
allowed and always succeeds the same way.

## Files to Change

- `backend/staff/views/staff_user_recovery_token_unexpire.py` — new view, per the shape above.
- `backend/staff/views/__init__.py` — export `staff_user_recovery_token_unexpire`.
- `backend/staff/urls.py` — register the new path as `staff-user-recovery-token-unexpire`.
- `backend/staff/tests/staff_user_recovery_token_unexpire_test.py` — new test file, mirroring
  `backend/staff/tests/staff_user_recovery_link_test.py`'s setup (`target_user`/`staff_user`/
  `superuser`/`regular_user` + tokens) and auth-matrix tests (401/403/404), plus: unexpiring a
  revoked (force-expired) token clears `invalidated_at` and extends `expires_at`; unexpiring an
  already-used token still succeeds but the row stays invalid (`used_at` still set); a token
  belonging to a different user 404s (ownership check); response body/status is `200 {}`.
