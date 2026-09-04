# Tests

Cover the model, the migration/backfill, the serializer, and the view.

- **Model** (`backend/accounts/tests/models/password_reset_token_test.py`, extend if it already exists, otherwise create it): `is_valid()` returns `False` when `used_at` is set, `False` when `invalidated_at` is set, `False` when `now > expires_at`, `True` otherwise; `expires_at`'s default callable produces a sane value when a token is created without it explicitly.
- **Migration/backfill** (`backend/accounts/tests/models/password_reset_token_expires_at_migration_test.py`), following `accounts/tests/models/user_profile_status_migration_test.py`'s pattern verbatim: resolve `games.tests.migration_state.historical_apps('accounts', '0009_passwordresettoken_expires_at_invalidated_at')`, call the migration's `_backfill_expires_at` function directly against rows created with historical/raw values, and assert:
  - A partially-elapsed token's backfilled `expires_at` matches `created_at + configured minutes`.
  - An already-expired token's backfilled `expires_at` is still in the past (stays expired).
  - `invalidated_at` stays `NULL` for every backfilled row.
  - The reverse (`_noop_reverse`) changes nothing.
- **Serializer** (`backend/staff/tests/serializers/staff_recovery_token_test.py`, mirroring `staff_user_list_test.py`'s shape): asserts the exact `fields` allowlist (**`token` is never a key in the serialized output**), correct `status` for each of the four states (used/revoked/expired/valid) including the Used > Revoked > Expired precedence when multiple conditions could apply, and `token_preview` equals the token's last 6 characters.
- **View** (`backend/staff/tests/staff_user_recovery_tokens_test.py`, mirroring `staff_user_recovery_link_test.py`'s shape): 401 unauthenticated, 403 non-staff, 404 unknown user id, `X-Skip-Cache: true` header present, staff and superuser both succeed, tokens ordered `-created_at`, empty list for a user with none, `reverse('staff-user-recovery-tokens', kwargs={'user_id': ...})` resolves.

## Files to Change

- `backend/accounts/tests/models/password_reset_token_test.py` — new or extended.
- `backend/accounts/tests/models/password_reset_token_expires_at_migration_test.py` — new.
- `backend/staff/tests/serializers/staff_recovery_token_test.py` — new.
- `backend/staff/tests/staff_user_recovery_tokens_test.py` — new.
