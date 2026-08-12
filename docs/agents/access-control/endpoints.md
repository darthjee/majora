# Standalone endpoints

Covers the access-route config, health check, and authentication endpoints — small, standalone
endpoints that don't belong to any single resource above.

## Access-route config endpoint
| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/access-route-config.json` | GET | **AllowAny** | Static JSON keyed by frontend page identifier |

Returns no model data and no user data — a static, non-paginated, always-public-cache-tier config
describing, per frontend page identifier, which resource-kind access check(s) (`game`,
`character` + `pcs`/`npcs`, `treasure`, `superuser`, `staffOrSuperuser`) that page must perform
before rendering. A page needing no check (e.g. `games`, `home`) has no entry. Authentication
classes are explicitly empty and permission is `AllowAny` — this response never varies by caller.

## Health check endpoint

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/health.json` | GET | **AllowAny** | `{"status": "ok"}` |

## Authentication endpoints

These manage identity; they do not expose domain data beyond success/failure.

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/users/login.json` | POST | Anyone. `username` matches against either `User.username` or `User.email`, case-insensitively. `403` if credentials are correct but the account is `denied` (checked only after password verification — never a pre-auth enumeration oracle). A `pending` account still logs in successfully — see the status gate below. Response also includes `cache_token` (see [CacheToken](#cachetoken-model) below) |
| `/users/logout.json` | POST | Authenticated. Deletes the caller's `CacheToken` row alongside their DRF `Token` |
| `/users/register.json` | POST | Anyone. New accounts always start `pending` |
| `/users/status.json` | GET | Anyone. `{"logged_in": false}` when unauthenticated or `denied`; adds `"status": "pending"` when pending (the only case with a `status` key); otherwise the full logged-in shape (`username`, `user_id`, `is_superuser`/`is_staff`, `settings`, `cache_token`) |
| `/staff/test-email.json` | POST | **Staff-or-superuser** |
| `/users/recover.json` | POST | Anyone. Always `200 {'sent': True}` regardless of match/status — enumeration-safe |
| `/users/reset-password.json` | POST | Anyone (requires valid reset token) |
| `/account/language.json` | POST | Authenticated |
| `/account/account.json` | GET/PATCH | Authenticated; always scoped to the requester, never another user. Exposed: `name`, `email`, `avatar_url` (Gravatar-derived, `null` if no email) — an [account/sensitive-information resource](principles.md#resource-categories) |

### `UserProfile.status` authentication gate

The project-wide default authentication class treats a resolved user whose `UserProfile.status`
isn't `approved` as fully unauthenticated. This applies **before** every other rule in this
document set: a `pending` or `denied` user looks anonymous everywhere, with the sole exceptions of
`/users/login.json`, `/users/status.json`, `/users/recover.json`, and the authorization-requests
poll endpoint below, each of which resolves the user's real status directly to implement the
behavior described above. New registrations start `pending`; staff/superuser accounts approve or
deny pending users via [User (Staff Management)](user.md).

## Authorization requests (device-authorize login)

A passwordless "authorize with logged device" login mode: a new device asks, by username or
email (case-insensitive), to be logged in; an already-authenticated session on another device
approves or denies the request.

| Endpoint | Method | Who can call | Notes |
|----------|--------|-------------|-------|
| `/users/authorization_requests.json` | POST | **AllowAny** (pre-login) | Enumeration-safe: identical `201` whether or not the `username` (matched against `User.username` or `User.email`, case-insensitively) matches a real user. `422 {"error": "missing_identifier"}` if `username` is missing/blank — a client-error case, not an enumeration concern. Per-IP rate-limited |
| `/users/authorization_requests/<uuid>.json` | GET | **AllowAny** (pre-login) | Polled with the request's own bearer token in `X-Authorize-Token` (compared via constant-time comparison, never exposed in plaintext). `403` if not found, token mismatch, or already `logged`/`denied`. `200` while `open`. `202` on `approved` — atomically transitions to `logged` (only one concurrent poll can win) and is the **only** point real login credentials are ever returned; if the request's own user is `denied`, this step is blocked and the same generic `403` is returned instead, preserving the enumeration-safety invariant. `422` if lazily expired. Rate-limited |
| `/account/authorization_requests.json` | GET | Authenticated | Paginated, newest-first, strictly scoped to the requester's own requests. Lazily re-checked for expiration before serialization |
| `/account/authorization_requests/<uuid>/deny.json` | PATCH | Authenticated, owner-only | `403` if not the caller's own request. `422` if not currently `open`. Sets `denied` |
| `/account/authorization_requests/<uuid>/authorize.json` | PATCH | Authenticated, owner-only | Requires the caller's own current password (re-authentication before granting a login elsewhere): `401` on mismatch. `403` if not the caller's own request. `422` if not currently `open`. Sets `approved` |

List serializer exposes only `uuid`, `created_at`, `status`, `ip`, `browser` — never the row's
`id`, hashed token, or `user`/`user_id`. `ip` is captured from `REMOTE_ADDR` only (deliberately
ignoring `X-Forwarded-For`), since it's shown to the approving human as a trust signal and must
not be client-spoofable. All five endpoints set `X-Skip-Cache`.

## `CacheToken` model

A per-user credential (`accounts.CacheToken`, random 40-char hex key, `OneToOneField` to `User`)
whose only purpose is to key the Tent proxy's private (per-user) response cache for restricted
endpoints piloting that mechanism — see `docs/agents/security-guidelines/proxy-rules.md`. It is
**never consulted by any backend authentication class**: unlike the DRF `Token`, an unhashed leak
of a `cache_token` value can never authenticate a real (mutating) backend request, so it carries no
read/write access of its own and needs no per-field role table.

- **Minted**: `get_or_create(user=...)` on `/users/login.json` and unconditionally on every
  `/users/status.json` logged-in response (not gated behind `session_auth`, unlike `token`).
- **Read**: only the owning user ever sees their own `cache_token`, via the two endpoints above —
  never returned for any other user, never listed/enumerable.
- **Invalidated**: deleted on `/users/logout.json`, alongside the `Token` row.
- **Superuser access**: none — not registered in Django admin (matches `PasswordResetToken`'s
  precedent of staying unregistered), and superusers have no special read path for other users'
  cache tokens beyond the general admin-pages carve-out at the top of this document set.
