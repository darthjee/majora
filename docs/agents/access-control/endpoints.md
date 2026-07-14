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
| `/users/test-email.json` | POST | Authenticated |
| `/users/recover.json` | POST | Anyone |
| `/users/reset-password.json` | POST | Anyone (requires valid reset token) |
| `/users/language.json` | POST | Authenticated |
| `/users/account.json` | GET/PATCH | Authenticated; always scoped to the requesting user, never a different user id |
