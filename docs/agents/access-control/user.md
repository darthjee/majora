# User (Staff Management)

**[Staff resource](principles.md#resource-categories).** Unlike `Player`, the Django `User` model
is exposed directly, but only to **Staff-or-superuser** — never publicly. All endpoints require
authentication and enforce **Staff-or-superuser** inline. Always sets `X-Skip-Cache: true` per the
[`X-Skip-Cache` rule](principles.md#x-skip-cache-rule).

| Action | Who can |
|--------|---------|
| List (`GET /staff/users.json`) | **Staff-or-superuser** |
| Detail (`GET /staff/users/<id>.json`) | **Staff-or-superuser** |
| Update name/email (`PATCH /staff/users/<id>.json`) | **Staff-or-superuser** |
| Generate/reuse recovery link (`POST /staff/users/<id>/recovery-link.json`) | **Staff-or-superuser** |
| List recovery tokens (`GET /staff/users/<id>/recovery-tokens.json`) | **Staff-or-superuser** |
| Approve a pending user (`POST /staff/users/approve.json`) | **Staff-or-superuser** |
| Deny/ban a user (`POST /staff/users/deny.json`) | **Staff-or-superuser** |

## Fields

List/detail: `id`, `name` (Django `username`), `email`, `status`
(`pending`/`approved`/`denied`, sourced from `UserProfile.status`), `display_name` (also from
`UserProfile`). No other `User` field (password, `is_staff`, `is_superuser`, `is_active`, etc.) is
ever serialized — this is a self-privilege-escalation guard per the [account resource
category](principles.md#resource-categories): no endpoint, staff-facing or otherwise, ever exposes
those fields as writable.

**List filters**: `status` (exact match) and `search` (case-insensitive substring, OR'd across
`name`/`display_name`/`email`) — both optional, combinable.

**Approve/deny**: identified by `{"user_id": <int>}` in the body (no dynamic path segment).
`approve` 404s if the user doesn't exist, 422s if not currently `pending`. `deny` 404s if the user
doesn't exist, works from any status (including re-denying an already-approved user to ban them),
and destroys every one of the user's tokens, immediately invalidating existing sessions. Neither
sends a notification to the affected user.

**Update rules**: only `name` and `email` may be changed, both validated for uniqueness. No
endpoint exists to create a user, delete a user, change a password directly, or toggle
`is_staff`/`is_superuser`/`is_active`.

**Recovery-link endpoint**: reuses a valid (unexpired, unused) password-reset token for the target
user if one exists, otherwise creates one, and returns its URL directly in the response body.
Unlike `/users/recover.json`, it never sends an email — the URL is meant to be shared by staff
directly with the user out-of-band.

**Recovery-tokens endpoint**: read-only listing of every `PasswordResetToken` row owned by the
target user (404 for an unknown user id), ordered `-created_at`, no pagination. Each row serializes
`id`, a convenience `status` (`used`/`revoked`/`expired`/`valid`, precedence
Used > Revoked > Expired > Valid — recomputed client-side rather than trusted from the API on
every render), `created_at`, `expires_at`, `used_at`, `invalidated_at`, and `token_preview` (last 6
characters of the token, for human cross-reference only) — the serializer's `fields` is an explicit
allowlist and the raw `token` is never serialized. No mutation controls exist on this endpoint;
unexpire/force-expire/delete land in a later sub-issue.
