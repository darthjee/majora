# Add the staff endpoints

Mirror the recovery-token views in `backend/staff/`.

| Method | URL | View / name |
|---|---|---|
| GET | `staff/users/<int:user_id>/api-tokens.json` | `staff_user_api_tokens` / `staff-user-api-tokens` |
| DELETE | `staff/users/<int:user_id>/api-tokens/<int:token_id>.json` | `staff_user_api_token_delete` / `staff-user-api-token-delete` |

- Same decorator stack as the owner views (`@restricted` outermost, `@parser_classes([JSONParser])`). Call `require_session(request)` first and `require_staff(request)` second.
- **List:** `get_object_or_404(User, pk=user_id)`, then the user's tokens `-created_at`, using `ApiTokenItemSerializer`.
- **Revoke:** `get_object_or_404(ApiToken, pk=token_id, owner_id=user_id)`, then log it and `delete()`, then 204. Log through a new `log_api_token_action(action, token_id, user_id, staff_user_id)` (in a new `_api_token_shared.py`, or by generalising `_recovery_token_shared`), never with the secret or the hash.

Tests:
- Staff and superusers list and revoke any user's tokens, including a superuser's and their own.
- A non-staff user gets 403 `not_allowed`, an anonymous caller gets 401, and a scoped token gets 403 `token_not_allowed` even for a staff owner.
- A token under the wrong `user_id` gives 404, and so does an unknown `user_id`.
- The revocation log line has no secret or hash (`assertLogs`).
- The deny view deletes the tokens, and re-approving does not restore them.
- `X-Skip-Cache: true` is set.

## Files to Change
- `backend/staff/views/staff_user_api_tokens.py`, `staff_user_api_token_delete.py`, `_api_token_shared.py` — new.
- `backend/staff/views/__init__.py` — export them.
- `backend/staff/urls.py` — add the 2 routes next to the recovery-token routes.
- `backend/staff/tests/staff_user_api_tokens_test.py`, `staff_user_api_token_delete_test.py` — new. Extend the deny-view test.
