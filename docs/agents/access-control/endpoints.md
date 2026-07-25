# Standalone endpoints

Covers the access-route config, health check, and authentication endpoints — small,
standalone endpoints that don't belong to any single resource above.

## Access-route config endpoint

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/access-route-config.json` | GET | **AllowAny** | Static JSON object keyed by page identifier (see below) |

Sourced from the plain Python dict `ACCESS_ROUTE_CONFIG` in
`backend/games/access_route_config.py`. Returns no model data and no user data — a static,
non-paginated, always-public-cache-tier config describing, for each frontend page identifier
(the same identifiers `HashRouteResolver#getPage` produces — `game`, `gameEdit`, `pcCharacter`,
`treasureEdit`, `staffUsers`, ...), which resource-kind access check(s) that page must perform
before rendering. Each page key maps to a list of descriptors — most pages need only one, but
e.g. `treasureEdit` needs both a superuser check and a treasure-ownership check — each descriptor
a `{"kind": ...}` dict (`"game"`, `"character"`, `"treasure"`, `"superuser"`, or
`"staffOrSuperuser"`), with `"character"` descriptors additionally carrying a `"characterKind"`
key (`"pcs"` or `"npcs"`). Page identifiers with no access check at all (e.g. `games`, `home`)
have no entry.

This endpoint carries no URL patterns — route paths and param names remain frontend-owned
routing knowledge (see [frontend.md](../frontend.md)). Authentication classes are explicitly empty
(`@authentication_classes([])`) and permissions are `AllowAny`, identical to the health check
endpoint below — this response never varies by caller, so it always gets the public/anonymous
`Cache-Control` tier.

## Health check endpoint

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/health.json` | GET | **AllowAny** | `{"status": "ok"}` |

Returns no model data and no user data. Used by the frontend to periodically verify backend
connectivity. Authentication classes are explicitly empty (`@authentication_classes([])`) and
permissions are `AllowAny`.

## Authentication endpoints

These endpoints manage identity; they do not expose domain data beyond confirmation of
success/failure. They are listed here for completeness.

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/users/login.json` | POST | Anyone |
| `/users/logout.json` | POST | Authenticated (`IsAuthenticated`) |
| `/users/register.json` | POST | Anyone |
| `/users/status.json` | GET | Anyone (returns `logged_in`, and when true, `is_superuser`/`is_staff` for the requester) |
| `/users/test-email.json` | POST | Staff-or-superuser (via `require_staff`) |
| `/users/recover.json` | POST | Anyone |
| `/users/reset-password.json` | POST | Anyone (requires valid reset token) |
| `/users/language.json` | POST | Authenticated |
| `/users/account.json` | GET/PATCH | Authenticated; always scoped to the requesting user, never a different user id. Exposed fields: `name`, `email`, `avatar_url` (Gravatar URL derived from a SHA-256 hash of the requester's own, trimmed/lowercased email; `null` when the user has no email; never derived from or returned for any other user) |

## Authorization requests (device-authorize login)

The `AuthorizationRequest` model (`accounts.models.authorization_request`, issue #701) backs a
passwordless "authorize with logged device" login mode: a new device asks, by username only, to
be logged in; an already-authenticated session on another device approves or denies the request.

| Endpoint | Method | Who can call | Notes |
|----------|--------|-------------|-------|
| `/users/authorization_requests.json` | POST | **AllowAny** (pre-login) | Creates a request. Enumeration-safe: identical `201` status/shape whether or not `username` matches a real user (an unknown-username request is still created but can never leave `open`, since it has no matching user to approve it). Per-IP rate-limited (`AnonRateThrottle`, scope `authorization_request_create`). |
| `/users/authorization_requests/<uuid>.json` | GET | **AllowAny** (pre-login) | Polled by the requesting device with the request's own bearer token in `X-Authorize-Token` (compared via `hmac.compare_digest` against a hashed value — never exposed in plaintext to any endpoint). `403` if not found, token mismatch, or already `logged`/`denied`. `200` while `open`. `202` on `approved` — atomically transitions the row to `logged` (guarded `UPDATE ... WHERE status='approved'`, so only one concurrent poll can win) and is the **only** point where real login credentials are ever returned. `422` if lazily expired. Per-IP/uuid rate-limited (scope `authorization_request_poll`). |
| `/account/authorization_requests.json` | GET | Authenticated (`IsAuthenticated`) | Paginated, newest-first, strictly scoped to `request.user`'s own requests (never another user's). Every returned row is lazily re-checked for expiration before serialization, so a request past its `expires_at` always displays as `expired` even if no mutating endpoint has touched it yet. |
| `/account/authorization_requests/<uuid>/deny.json` | PATCH | Authenticated (`IsAuthenticated`), owner-only | `403` if the request doesn't belong to the caller. `422` if not currently `open` (including lazily-expired). Sets `denied`. |
| `/account/authorization_requests/<uuid>/authorize.json` | PATCH | Authenticated (`IsAuthenticated`), owner-only | Requires the caller's own current password in the request body (re-authentication before granting a login elsewhere): `401` on mismatch. `403` if the request doesn't belong to the caller. `422` if not currently `open` (including lazily-expired). Sets `approved`. |

Serializer (`AuthorizationRequestListSerializer`, used by the list endpoint above) exposes only
`uuid`, `created_at`, `status`, `ip`, `browser` — never the row's `id`, `token_hash` (the hashed
bearer token), or `user`/`user_id`. `ip` is captured from `REMOTE_ADDR` only (deliberately
ignoring `X-Forwarded-For`, unlike the analytics-only extraction in
`statistics.middleware`), since it is shown to the approving human as a trust signal and must not
be client-spoofable. All five endpoints set `X-Skip-Cache`.
