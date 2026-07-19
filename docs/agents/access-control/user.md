# User (Staff Management)

Unlike `Player`, the Django `User` model is exposed directly, but only to **Staff-or-superuser**
— never publicly. All endpoints below require `CookieTokenAuthentication` and enforce
**Staff-or-superuser** inline via `require_staff` in `backend/games/views/common.py` (matching
the `treasures_list.py` convention of enforcing auth inline rather than through DRF permission
classes). All GET and write responses set `X-Skip-Cache: true` since the data is
per-caller-authorization sensitive.

| Action | Who can |
|--------|---------|
| List (`GET /staff/users.json`) | **Staff-or-superuser** |
| Detail (`GET /staff/users/<id>.json`) | **Staff-or-superuser** |
| Update name/email (`PATCH /staff/users/<id>.json`) | **Staff-or-superuser** |
| Generate/reuse recovery link (`POST /staff/users/<id>/recovery-link.json`) | **Staff-or-superuser** |

**Exposed fields** (list and detail): `id`, `name` (Django `username`), `email`. No other `User`
field (password, `is_staff`, `is_superuser`, `is_active`, etc.) is ever serialized.

**Update rules**: only `name` and `email` may be changed; both are validated for uniqueness
against other `User` rows (`username` is unique at the DB level, `email` is not, so uniqueness
is enforced in `StaffUserUpdateSerializer`). No endpoint exists to create a user, delete a user,
change a password directly, or toggle `is_staff`/`is_superuser`/`is_active`.

**Recovery-link endpoint**: reuses a valid (unexpired, unused) `PasswordResetToken` for the
target user if one exists, otherwise creates a new one (`get_or_create_recovery_token` in
`backend/accounts/views/password_reset/_shared.py`), and returns its URL directly in the response
body. Unlike `/users/recover.json`, it never sends an email — the URL is meant to be shared by
staff directly with the user out-of-band.
