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

## Domain configuration endpoint

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/domain/config.json` | GET | **AllowAny** | `{"favicon": null\|string, "title": string, "sub_title": string}` |

Backs the `DomainConfiguration` model (`domains` app, `OneToOneField` to `DomainGroup`) — per-tenant
branding overrides (favicon path, navbar-brand title/sub-title). Resolution: the request's host
(port-stripped, lowercased) is looked up against `Domain`, then that `Domain`'s `DomainGroup`, then
that group's `DomainConfiguration` row. An unrecognized host, or a recognized `DomainGroup` with no
`DomainConfiguration` row, both return the same full-defaults response (`favicon: null`,
`title: "Majora"`, `sub_title: "RPG"`) — never a 404. A `null` field falls back to its default; an
explicit `""` is returned as-is (shown as empty by the frontend). Exposes no `id`, no
`domain_group` reference, and no way to enumerate registered domains/hosts — only the three
merged branding values for the caller's own resolved host. Deliberately does not set
`X-Skip-Cache`: unlike most `AllowAny` endpoints in this file, this response is cacheable, since
`DomainConfiguration` only changes at deploy time (or a manual admin edit), not per-request or
per-user.

`DomainConfiguration` has no create/update/delete API of its own — it's editable exclusively via
Django admin (`domains/admin.py`), so it follows this document set's superuser/staff admin-pages
carve-out for writes; this endpoint only ever reads it.

## Authentication endpoints

These manage identity; they do not expose domain data beyond success/failure.

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/users/login.json` | POST | Anyone. `username` matches against either `User.username` or `User.email`, case-insensitively. `403` if credentials are correct but the account is `denied` (checked only after password verification — never a pre-auth enumeration oracle). A `pending` account still logs in successfully — see the status gate below. Response also includes `cache_token` (see [CacheToken](#cachetoken-model) below) |
| `/users/logout.json` | POST | Authenticated. Deletes the caller's `CacheToken` row alongside their DRF `Token` |
| `/users/register.json` | POST | Anyone. New accounts always start `pending` |
| `/users/status.json` | GET | Anyone. `{"logged_in": false}` when unauthenticated or `denied`; adds `"status": "pending"` when pending (the only case with a `status` key); otherwise the full logged-in shape (`username`, `user_id`, `is_superuser`/`is_staff`, `settings`, `cache_token`) |
| `/users/header_status.json` | GET | Anyone. Deliberately reuses `/users/status.json`'s exact access rules and resolution logic (same `UserProfile.status` gate, same `CacheToken` minting via `get_or_create`) but returns a narrower field set — `logged_in`, `status` (pending-only), `is_superuser`, `is_staff`, `cache_token`, `token` (session-auth only, same conditional as `/users/status.json`), `settings` — for `Header`'s exclusive use, omitting only `username` and `user_id` |
| `/staff/test-email.json` | POST | **Staff-or-superuser** |
| `/users/recover.json` | POST | Anyone. Always `200 {'sent': True}` regardless of match/status — enumeration-safe |
| `/users/reset-password.json` | POST | Anyone (requires valid reset token) |
| `/account/language.json` | POST | Authenticated |
| `/account/account.json` | GET/PATCH | Authenticated; always scoped to the requester, never another user. Exposed: `name`, `email`, `avatar_url` (Gravatar-derived, `null` if no email) — an [account/sensitive-information resource](principles.md#resource-categories) |

### `UserProfile.status` authentication gate

The project-wide default authentication class treats a resolved user whose `UserProfile.status`
isn't `approved` as fully unauthenticated. This applies **before** every other rule in this
document set: a `pending` or `denied` user looks anonymous everywhere, with the sole exceptions of
`/users/login.json`, `/users/status.json`, `/users/header_status.json`, `/users/recover.json`, and
the authorization-requests poll endpoint below, each of which resolves the user's real status
directly to implement the behavior described above. New registrations start `pending`;
staff/superuser accounts approve or deny pending users via [User (Staff Management)](user.md).

## Scoped API token endpoints

Index of the token management endpoints; see [ApiToken](api-token.md) for the full behaviour.
Every one is **session only** (a scoped token gets `403` `token_not_allowed`), accepts JSON
bodies only (`415` otherwise) and sets `X-Skip-Cache: true`.

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/account/api_tokens.json` | GET | Authenticated; the caller's own tokens, newest first |
| `/account/api_tokens.json` | POST | Authenticated; the owner is always the caller. `201` with the full token, once; `400` `scope_staff_only` for `statistics:read` on a non-staff owner |
| `/account/api_tokens/options.json` | GET | Authenticated; grantable scopes (`statistics:read` for staff only), reachable games and `all_games` |
| `/account/api_tokens/<id>.json` | PATCH | Authenticated, owner-only (`404` otherwise); `name` only |
| `/account/api_tokens/<id>.json` | DELETE | Authenticated, owner-only (`404` otherwise); `204` |
| `/staff/users/<user_id>/api-tokens.json` | GET | **Staff-or-superuser**; `404` for an unknown user |
| `/staff/users/<user_id>/api-tokens/<token_id>.json` | DELETE | **Staff-or-superuser**; `404` unless the token belongs to `user_id`; logged |

## Staff statistics export

The raw statistics export for the investigation script (#1699); see
[Staff Statistics](staff-statistics.md#export) and the
[export endpoint spec](../specs/statistics-bug/export-endpoint.md#access-matrix). It is the
only `staff/` route a scoped token can reach.

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/staff/statistics/export.json` | GET | **Staff-or-superuser**, re-checked on every request: a session, a legacy `Authorization: Token`, or a scoped token with `statistics:read` whose owner is still staff (`403` `not_allowed` otherwise; `403` `scope_missing` for a token without the scope) |

## Staff photo endpoints

Index of the staff-only photo management endpoints; see [Staff Photos](staff-photo.md) for the
full behaviour. All set `X-Skip-Cache: true`.

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/staff/photos.json` | GET | **Staff-or-superuser** |
| `/staff/photos/<photo_type>.json` | GET | **Staff-or-superuser** |
| `/staff/photos/<photo_type>/<photo_id>/replace.json` | POST | **Staff-or-superuser** |
| `/staff/photos/<photo_type>/<photo_id>/deletable.json` | GET | **Staff-or-superuser** |
| `/staff/photos/<photo_type>/<photo_id>.json` | DELETE | **Staff-or-superuser** |

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
  `/users/status.json`/`/users/header_status.json` logged-in response (not gated behind
  `session_auth`, unlike `token`).
- **Read**: only the owning user ever sees their own `cache_token`, via the two endpoints above —
  never returned for any other user, never listed/enumerable.
- **Invalidated**: deleted on `/users/logout.json`, alongside the `Token` row.
- **Superuser access**: none — not registered in Django admin (matches `PasswordResetToken`'s
  precedent of staying unregistered), and superusers have no special read path for other users'
  cache tokens beyond the general admin-pages carve-out at the top of this document set.

## `ApiToken` model

A scoped API token (`accounts.ApiToken`, many per user) sent as
`Authorization: Bearer mjr_<prefix>_<secret>` and read by `ApiTokenAuthentication`, which runs
**before** `CookieTokenAuthentication` in `DEFAULT_AUTHENTICATION_CLASSES`. Full design:
[ApiToken](api-token.md#token-format-and-authentication) and [Token scopes](token-scopes.md).

- **Stored**: only the SHA-256 hash of the secret part and the non-secret, unique `prefix`; the
  plain token is returned once, at creation.
- **Bearer only**: a request without a Bearer header is left to `CookieTokenAuthentication`
  unchanged. A Bearer request that does not authenticate (malformed, unknown prefix, wrong secret,
  expired, inactive or non-approved owner) always gets `401` `token_invalid` — never a fallback to
  the session or to anonymous.
- **Never widens access**: the normal role/permission checks still run as the owner; on top of
  that the token must carry every scope the view declares via `@token_scopes` for the request
  method (`HEAD` follows `GET`; an empty list means a public read needing no scope). Missing scope
  → `403` `scope_missing`.
- **Catalogue**: `accounts/scopes.py`, `<family>:read|write`, except the read-only, staff-only
  `statistics:read`. Stored scopes no longer in the catalogue grant nothing.
- **Fail closed**: a view with no `@token_scopes` declaration, or no entry for the method
  (including `OPTIONS`), is refused with `403` `token_not_allowed`. Views not yet declared are
  listed in the coverage test's pending list (sub-issues #1630–#1639).
- **Excluded routes**: everything under `account/`, `users/`, `staff/` and `admin/` always refuses
  tokens with `403` `token_not_allowed`, checked before any declaration. The one exception is
  the exact route `staff/statistics/export.json` (never a prefix), which needs
  `statistics:read` and a still-staff owner.
- **Game restriction**: when the token has a game list, a `game_slug` URL kwarg not in it gets
  `403` `game_not_allowed`. Only the `game_slug` kwarg is read; routes game-scoped by other means
  must enforce the list in-view before being declared. An empty list at creation means all games;
  deleting a token's last allowed game revokes the token rather than widening it.
- **Error body**: `scope_missing`, `game_not_allowed` and `token_not_allowed` use the standard
  `{"errors": {"detail": ["<code>"]}}` body; no 404 masking.
- **Invalidated**: all of a user's tokens are deleted when staff deny the user
  ([User (Staff Management)](user.md)). Revoking deletes the row; there is no soft revoke.
- **Management**: owners list, create, rename and revoke their own tokens, and staff list and
  revoke any user's tokens, through the session-only endpoints above
  ([ApiToken](api-token.md)). Superusers get no extra path; the model is not registered in
  Django admin.
