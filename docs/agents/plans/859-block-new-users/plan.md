# Plan: Block new users

Issue: [859-block-new-users.md](../../issues/859-block-new-users.md)

## Overview

Add a `status` field (`pending`/`approved`/`denied`) to `UserProfile`. New registrations start `pending`; a migration backfills every existing user to `approved`. A single choke point (`CookieTokenAuthentication`, plus the `/auth/status` endpoint's own auth resolution) makes non-`approved` users look unauthenticated everywhere except login itself, where `pending` is explicitly still allowed through so the frontend can show a dedicated "awaiting approval" screen; `denied` is hard-blocked at every credential-issuing endpoint. New staff-only `approve`/`deny` endpoints let admin/staff manage the status, and the `/staff/users` page gains status/display-name columns, colored badges, and filters.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### `UserProfile.status`

Backend adds `status` to `UserProfile` with values `'pending'` | `'approved'` | `'denied'` (field default `'pending'`). Frontend/translator never touch this field directly, but consume it via the two endpoints below.

### `GET /users/status.json` (existing endpoint, extended payload)

Consumed by `HeaderController.checkStatus()` (`frontend/assets/js/components/common/header/controllers/HeaderController.js`), backed by `AuthClient#status` (`frontend/assets/js/client/AuthClient.js`).

- No valid token/session: `{"logged_in": false}` — unchanged.
- Valid token, `status == 'approved'`: unchanged existing shape — `{"logged_in": true, "username", "user_id", "is_superuser", "is_staff", "settings": {"favorite_language"}, "token"?}`.
- Valid token, `status == 'pending'`: **new** — `{"logged_in": false, "status": "pending"}`. This is the only case that carries a `status` key; it's how the frontend tells "genuinely logged out" apart from "logged in but awaiting approval" and shows the dedicated pending screen.
- Valid token, `status == 'denied'`: `{"logged_in": false}` (no `status` key) — a narrow fallback only, since `deny.json` already destroys the user's tokens.

### `GET /staff/users.json` (existing endpoint, extended)

- Response items gain `status` (`'pending'|'approved'|'denied'`) and `display_name` (string, may be `null`) alongside the existing `id`/`name`/`email`.
- New query params, both optional and combinable:
  - `status` — exact match on one of the three status values.
  - `search` — case-insensitive substring match, OR'd across `name` (username), `display_name`, and `email`.

### `POST /staff/users/approve.json` / `POST /staff/users/deny.json` (new, staff/admin only)

- Auth: identical gate to every other `/staff/*` endpoint — `require_staff` (401 unauthenticated, 403 non-staff).
- Request body: `{"user_id": <int>}`.
- `approve`: 404 if `user_id` doesn't exist; 422 `{"errors": {...}}` if the user's current status isn't `pending`; on success, 200 with the updated user object (same shape as a `/staff/users.json` row: `id`, `name`, `email`, `status`, `display_name`).
- `deny`: 404 if `user_id` doesn't exist; no status precondition (works from any status, including re-denying an already-approved user to ban them); destroys all of the user's `Token`s; on success, 200 with the updated user object (same shape as above).

### i18n

Frontend consumes translation keys under the existing `staff_users_page` namespace (new keys for the status/display-name columns, status labels, and approve/deny actions) plus a new namespace for the pending-approval screen (exact name decided by the frontend agent when it builds that screen — record it in `frontend.md`/`translator.md` once chosen). Translator owns adding the keys to every locale (`en.yaml`, `pt.yaml`); frontend owns choosing the exact key names and using them.
