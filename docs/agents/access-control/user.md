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
| Approve a pending user (`POST /staff/users/approve.json`) | **Staff-or-superuser** |
| Deny/ban a user (`POST /staff/users/deny.json`) | **Staff-or-superuser** |

**Exposed fields** (list and detail): `id`, `name` (Django `username`), `email`, `status`
(`pending`/`approved`/`denied`, sourced from the linked `UserProfile.status`), `display_name`
(also sourced from `UserProfile`, not `User`). No other `User` field (password, `is_staff`,
`is_superuser`, `is_active`, etc.) is ever serialized.

**List filters** (`GET /staff/users.json`): both optional and combinable — `status` (exact match
on one of the three status values) and `search` (case-insensitive substring match, OR'd across
`name`/`display_name`/`email`).

**Approve/deny endpoints**: identified by `{"user_id": <int>}` in the request body
(no dynamic path segment). `approve` 404s if the user doesn't exist, 422s if the user's current
`UserProfile.status` isn't `pending`, otherwise sets it to `approved`. `deny` 404s if the user
doesn't exist; has no status precondition (works from any status, including re-denying an
already-approved user to ban them); sets `status` to `denied` and destroys every one of the
user's `Token` rows, immediately invalidating any existing session/token access. Both return the
same shape as a `/staff/users.json` row on success. Neither sends a notification to the affected
user.

**Update rules**: only `name` and `email` may be changed; both are validated for uniqueness
against other `User` rows (`username` is unique at the DB level, `email` is not, so uniqueness
is enforced in `StaffUserUpdateSerializer`). No endpoint exists to create a user, delete a user,
change a password directly, or toggle `is_staff`/`is_superuser`/`is_active`.

**Recovery-link endpoint**: reuses a valid (unexpired, unused) `PasswordResetToken` for the
target user if one exists, otherwise creates a new one (`get_or_create_recovery_token` in
`backend/accounts/views/password_reset/_shared.py`), and returns its URL directly in the response
body. Unlike `/users/recover.json`, it never sends an email — the URL is meant to be shared by
staff directly with the user out-of-band.
