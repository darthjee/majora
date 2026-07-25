# Issue: Add authorize login

## Problem
We need a way to log in on a device where the current password isn't conveniently available (e.g. a mobile device), by authorizing the login from another device where the user is already logged in.

## Solution
Introduce a device-authorization login mode, alongside the existing password login:

- In the login modal, a radio option to choose the login mode:
  - password (current option)
  - authorize with logged device
- A page where the user can see their pending/past authorization requests and approve or deny them.

### Backend location
Backend code lives under `accounts` (`backend/accounts`).

Requests defined here do **not** go through `RequestStore` (that store is dedicated to resources).

### Login modal — new mode: "authorize"
- Has the login field, no password field.
- `POST /users/authorization_requests.json` creates the request.
  - Response: `uuid`, `token`, `status`.
  - Modal switches to "waiting for approval".
    - Polls `GET /users/authorization_requests/uuid.json` every 5 seconds.
      - Sends the `token` in the `X-Authorize-Token` header.
    - Retries on error.
    - Polls until a terminal status is reached (`expired`, `denied`, `accepted`) or the client-side expiration timer elapses (server is always the source of truth for expiration — see below).

### Model: `AuthorizationRequest`
- `id` — never exposed in any serializer.
- `uuid` — safe external identifier.
- `token` — high-entropy (e.g. `secrets.token_urlsafe(32)`), stored hashed at rest (it's a short-lived bearer credential equivalent to a login capability), not exposed in the regular list serializer; compared using constant-time comparison (`hmac.compare_digest`) against the hashed value wherever it's checked.
- `ip` of requester (captured via the same mechanism used elsewhere in the codebase; note this IP is shown to a human as a trust signal in the authorize modal — see below — so the extraction method should be reviewed for spoofability rather than assumed safe by default).
- `browser` information of requester.
- `created_at` / `updated_at`.
- `user_id` — not exposed in the serializer.
- `expiration date` (1 hour after creation, stored/compared in UTC; API responses include timezone info).
- `status`: `open`, `approved`, `denied`, `expired`, `logged`.
  - Full state machine (to be nailed down during implementation, but at minimum):
    - `open` → `approved` (via the authorize PATCH), `denied` (via the deny PATCH), or `expired` (lazily, once past expiration).
    - `approved` → `logged` (exactly once, the first time the polling GET observes `approved` and hands back credentials — this transition must be atomic, e.g. `UPDATE ... WHERE status='approved'` guarded so only one concurrent poll can win the transition, to prevent two requests from receiving credentials for the same approval).
  - Expiration must be evaluated lazily (recomputed against "now") on **every** endpoint that reads or mutates a request — not just the authorize action — so an expired-but-not-yet-flagged row is never treated as usable by any of the four endpoints.
- Versioned using the versioning module.

### Authorization requests page
- Menu item "Authorizations" under the `My account` dropdown menu.
- Route `/#/account/authorization_requests/`.
  - Lists authorization requests, newest first, as a paginated table.
    - Columns: uuid, request date, status (color-coded: denied — red, open — green, approved — blue, logged — darker blue, expired — gray).
  - Each `open` item has "dismiss" and "authorize" buttons, each opening a confirmation modal.
    - Both modals display the request's stored IP and browser information, so the approving user can verify it's actually their own device before granting access.
    - Dismiss modal: on confirmation, marks the request `denied` (permanently unusable, still shown in the list). Calls `PATCH /account/authorization_requests/:uuid/deny`.
    - Authorize modal: has a confirm action and a password field (re-authenticating the approving user before they can grant a new login). Calls `PATCH /account/authorization_requests/:uuid/authorize`, carrying the password.

### Endpoints

#### `PATCH /account/authorization_requests/:uuid/deny`
- Requires an authenticated, logged-in user (`IsAuthenticated`); returns 403 if the request doesn't belong to the requesting user.
- Returns 422 if the request isn't currently `open` (including if it's lazily-expired).
- Otherwise: sets status to `denied`, returns 202.
- Standard session authentication + CSRF enforcement (no `@csrf_exempt`).

#### `PATCH /account/authorization_requests/:uuid/authorize`
- Requires an authenticated, logged-in user (`IsAuthenticated`); returns 403 if the request doesn't belong to the requesting user.
- Returns 422 if the request isn't currently `open`.
- If lazily-expired: sets status to `expired` and returns 422.
- Otherwise: sets status to `approved`, returns 202.
- Standard session authentication + CSRF enforcement (no `@csrf_exempt`).

#### `POST /users/authorization_requests.json`
- Unauthenticated (`AllowAny`, explicitly commented as intentionally public/pre-login).
- If the login doesn't match a real user, responds exactly like the success case (same status code and payload shape) but the created/phantom request can never transition out of `open` — this avoids leaking user existence via a distinguishable response (do **not** use a 5xx status as an intentional "unknown user" signal: it pollutes error monitoring and is likely to be "fixed" by a future maintainer, silently reopening the enumeration hole).
- Creates the `AuthorizationRequest` (for a real login).
- Returns `uuid`, `expiration`, `token`.
- Rate-limited per IP to prevent brute-force enumeration/flooding.

#### `GET /users/authorization_requests/uuid.json`
- Unauthenticated (`AllowAny`, explicitly commented — the requesting device isn't logged in yet).
- Returns 403 if the authorization request isn't found, if the `X-Authorize-Token` header doesn't match (constant-time comparison), or if status is already `logged` or `denied` (already consumed/terminal).
- Returns 200 with `status` if `open`.
- Returns 202 if status is `approved`:
  - Atomically transitions the record to `logged` on this read (see model notes above), and the response includes the login credentials for the requesting device (same token/session payload the normal password-based login issues) — this is the only point at which those credentials are ever returned.
  - Response payload otherwise mirrors the status prior to the update.
- Rate-limited per IP/uuid to mitigate polling abuse.

### Cache
All new endpoints set the `X-Skip-Cache` response header (backend side), and the frontend sends `X-Skip-Cache` on every request to these endpoints (creation, polling, list, deny, authorize), per the project's cache-bypass convention for user-specific data.

## Benefits
Good passwords are sometimes stored/remembered on a single machine and aren't conveniently available on other devices (especially mobile). This flow lets a user log in on a new device by approving it from a device where they're already authenticated, without needing to type or retrieve the password.
