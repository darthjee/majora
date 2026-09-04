# Add the `delete` endpoint

Add `DELETE /staff/users/<int:user_id>/recovery-tokens/<int:token_id>.json`, same decorator stack
and ownership check as the other two, using `@api_view(['DELETE'])`. Note the path has no action
suffix — it's the bare token resource under `DELETE`, distinct from the `GET` list at
`recovery-tokens.json` and the two `POST .../<token_id>/<action>.json` paths.

On success: log `pk`/`user_id`/`action='delete'`/acting staff id (never the raw `token`) before
deleting (the `pk` is gone after `.delete()`), delete the row, and return
`Response(status=204)` (no body).

No token-state guard: deleting the last valid token for a user is allowed — it's the intended way
to "revoke" a token outright rather than just force-expiring it.

## Files to Change

- `backend/staff/views/staff_user_recovery_token_delete.py` — new view, per the shape above.
- `backend/staff/views/__init__.py` — export `staff_user_recovery_token_delete`.
- `backend/staff/urls.py` — register the new path as `staff-user-recovery-token-delete`.
- `backend/staff/tests/staff_user_recovery_token_delete_test.py` — new test file, mirroring
  `staff_user_recovery_link_test.py`'s setup and auth-matrix tests (401/403/404), plus: deleting a
  token removes the row (`PasswordResetToken.objects.filter(pk=...).exists()` is `False`) and
  returns 204 with no body; deleting the user's only/last valid token is allowed; a token belonging
  to a different user 404s; deleting an already-deleted token id (simulating the stale-list/
  concurrent-delete race) 404s.
