# Plan: Add authorize login

Issue: [701-add-authorize-login.md](../../issues/701-add-authorize-login.md)

## Overview

Add a second, passwordless login mode — "authorize with logged device" — alongside the
existing password login. A new device requests a login by username only; the request is
approved or denied from an already-authenticated session, on a new "Authorization
requests" account page. On approval, the requesting device receives real login
credentials (same shape as `POST /users/login.json`) the next time it polls. Backend adds
a new `AuthorizationRequest` model + 5 endpoints under a new `accounts` sub-package;
frontend adds a login-modal mode, a paginated list/detail page with confirm modals, and a
lightweight interval-polling controller; translator adds the new i18n strings both use.

This plan folds in the findings from a pre-implementation security review (see the issue
file's Solution section for the hardened design) — several of these close gaps the
original issue didn't fully specify (credential issuance point, enumeration-safe
responses, atomicity of the approve→logged transition, lazy expiration, rate limiting,
CSRF/permission-class explicitness, IP/browser shown to the human approver). Follow the
issue file as the authoritative spec; this plan translates it into concrete steps against
this codebase's existing conventions.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### Endpoints (all under Django, so all paths end in `.json` — the Tent proxy only
routes `*.json` to the backend; the issue's own endpoint paths for `deny`/`authorize`
omitted the suffix, this plan corrects that)

1. **`POST /users/authorization_requests.json`** — `AllowAny` (pre-login).
   - Request: `{ "username": "<login>" }`.
   - Response — **identical status/shape whether or not `username` matches a real
     user** (enumeration-safe; replaces the issue's original "500 for unknown user"
     idea): `201 { "uuid": "<uuid>", "expiration": "<ISO8601 UTC, tz-aware>", "token":
     "<opaque bearer token>" }`. A request for an unknown username is still created but
     can never leave `open` (no matching user to approve it).
   - Rate-limited per source IP.

2. **`GET /users/authorization_requests/<uuid>.json`** — `AllowAny` (pre-login), polling.
   - Header: `X-Authorize-Token: <token>` from step 1 (looked up via constant-time
     comparison against the hashed stored value).
   - `403 { "error": "not_found" }` — uuid not found, token mismatch, or status is
     already `logged`/`denied` (both terminal/consumed).
   - `200 { "status": "open" }`.
   - `202 { "status": "approved", "token": "<login token>" }` — **only** on the poll
     that observes `approved`; atomically transitions the row to `logged` in the same
     query (e.g. `UPDATE ... WHERE status='approved'` via `filter(...).update(...)`
     checked for `rowcount`/`select_for_update()`) so a second concurrent poller gets the
     `403 logged` case instead of a second token. The `token` in this response is a real
     login token — same value/shape/usage as `POST /users/login.json`'s `token` — stored
     by the frontend via `AuthStorage.setToken` exactly like a normal login.
   - `422 { "status": "expired" }` — status is lazily found to be past `expiration` at
     read time; also flips the row to `expired`.
   - Rate-limited per source IP and/or per uuid.

3. **`GET /account/authorization_requests.json`** — `IsAuthenticated` (not in the
   original issue text, but required for the account page's list — added here).
   Standard paginated list (see `docs/agents/pagination.md`), scoped to the
   authenticated user's own requests, newest first. Each row: `{ "uuid": "...",
   "created_at": "<ISO8601 UTC>", "status": "open|approved|denied|expired|logged", "ip":
   "...", "browser": "..." }` (never `id`, `token`, `user_id`).

4. **`PATCH /account/authorization_requests/<uuid>/deny.json`** — `IsAuthenticated`.
   - `403 { "error": "not_found" }` — request doesn't belong to the caller.
   - `422 { "error": "not_open" }` — not currently `open` (including lazily-expired).
   - `202` — sets `denied`.

5. **`PATCH /account/authorization_requests/<uuid>/authorize.json`** — `IsAuthenticated`.
   - Request: `{ "password": "<approving user's own current password>" }` (re-auth
     before granting a login elsewhere).
   - `403 { "error": "not_found" }` — request doesn't belong to the caller.
   - `401 { "error": "invalid_credentials" }` — password doesn't match the caller's own
     password (not specified in the issue; mirrors `login.py`'s own "Invalid credentials"
     convention rather than introducing a new code).
   - `422 { "error": "not_open" }` / `422 { "error": "expired" }` (sets `expired`) — same
     as `deny`.
   - `202` — sets `approved`.

All five endpoints set the `X-Skip-Cache` response header. On the frontend, POST/PATCH
already auto-skip-cache (`BaseClient`); the two `GET`s need explicit wiring since neither
existing skip-cache mechanism (`skipCacheEndpoints.js` exact-match / `skipCacheSuffixes.js`
suffix-match) can express "dynamic uuid segment immediately before `.json`" — see
[frontend.md](frontend.md) for the fix.

### Model fields the frontend/translator only need to know the *shape* of

`status` values: `open`, `approved`, `denied`, `expired`, `logged` — frontend maps each to
a badge color (denied=red, open=green, approved=blue, logged=darker blue,
expired=gray) and an i18n label.
