# Plan: Add staff user routes

Issue: [286-add-staff-user-routes.md](../../issues/286-add-staff-user-routes.md)

## Overview

Add a staff/superuser-only surface for managing `User` accounts: three backend endpoints
(list, detail+update, recovery-link) gated on `is_staff or is_superuser`, and three matching
frontend hash routes (`/staff/users`, `/staff/users/:id`, `/staff/users/:id/edit`) plus a nav
link, following the exact conventions already used for the superuser-only Treasures feature
(`Treasures.jsx` / `TreasureEdit.jsx` / `treasures_list.py` / `treasure_detail.py`). `User` has
never been an exposed resource in this app before, so this introduces it as a new,
globally-scoped (non-game-scoped) entity, and introduces `is_staff` as a new elevated role
alongside the existing `Superuser` role — strictly additive: `is_staff` only grants access to
this new User-management surface, not to any other superuser-only action (Treasures, etc.).

## Context

There is currently no way for staff/admins to view or manage user accounts through the app,
and when a user cannot access the email address tied to the self-service password-recovery
flow (`/users/recover.json`), staff have no way to help them — the recovery URL is only ever
sent by email. Full issue text: [286-add-staff-user-routes.md](../../issues/286-add-staff-user-routes.md).

Per the product-owner review performed before this plan: `product.md`/`access-control.md`
currently document only `Superuser` as an elevated role; `is_staff` is an unused Django field
with no product-level meaning yet. `User` is not scoped by game (unlike `Character`, `Player`,
`GameMaster`), so staff should see/edit **all** users globally. The `name` the issue asks staff
to edit maps to Django's `User.username` field (there is no separate "name" field on `User`;
registration already treats `username` as "name" — see `REGISTER_REQUIRED_FIELDS` in
`source/games/views/auth/_shared.py`). Reusing `PasswordResetToken` to return a URL without
emailing it is consistent with existing token semantics — the model itself has no
delivery mechanism baked in, only `send_password_reset_email` couples it to email today.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

Docs updates (`docs/agents/product.md`, `docs/agents/access-control.md`) are handled directly
by the architect as part of final integration, not delegated to a specialist — per
`docs/agents/architecture.md`'s instruction to update `access-control.md` whenever a new model
or endpoint is introduced, and `product.md` since `is_staff` becomes a new documented role.

## Shared contracts

### `GET /users/status.json` gains a new field

The existing status payload (`source/games/views/auth/status.py`, `_build_payload`) gains a
new boolean sibling to `is_superuser`:

```json
{ "logged_in": true, "username": "...", "user_id": 1, "is_superuser": false, "is_staff": true, "settings": { ... } }
```

Frontend gates all new UI (the three routes below and the nav link) on
`is_superuser || is_staff`.

### New backend endpoints (all under `/staff/users`, all requiring authentication via
`CookieTokenAuthentication` and `request.user.is_superuser or request.user.is_staff`; 401 when
unauthenticated, 403 when authenticated but neither staff nor superuser)

| Method | URL | Purpose | Body | Success response |
|--------|-----|---------|------|-------------------|
| GET | `/staff/users.json` | Paginated list of all `User` records | — | `[{ "id": 1, "name": "...", "email": "..." }, ...]` with standard `page`/`pages`/`per_page` headers (via `Paginator`/`paginated_list_response`) |
| GET | `/staff/users/<id>.json` | Single user detail | — | `{ "id": 1, "name": "...", "email": "..." }` (404 if not found) |
| PATCH | `/staff/users/<id>.json` | Update `name` (→ `username`) and/or `email` only | `{ "name"?: "...", "email"?: "..." }` | 200 with same shape as detail; `400 { "errors": { "name"|"email": [...] } }` on duplicate/invalid values |
| POST | `/staff/users/<id>/recovery-link.json` | Reuse a valid (unexpired, unused) `PasswordResetToken` for the user, or create one | — (no body) | `200 { "url": "<FRONTEND_BASE_URL>/#/recover-password?token=<token>" }`. **Never** sends an email. |

`name` is always `user.username` — there is no other "name" field on Django's `User` model.

### New frontend routes (all client-side gated to `is_superuser || is_staff`, redirecting to
`/` otherwise, mirroring `TreasuresController`/`TreasureEditController`'s `AdminAccess`
pattern)

| Hash route | Page key | Component |
|---|---|---|
| `/staff/users` | `staffUsers` | `StaffUsers.jsx` |
| `/staff/users/:id` | `staffUser` | `StaffUser.jsx` |
| `/staff/users/:id/edit` | `staffUserEdit` | `StaffUserEdit.jsx` |

### Nav link

A new `Nav.Link` to `#/staff/users`, visible when `isSuperUser || isStaff`, added next to the
existing Treasures nav link in `HeaderHelper.jsx`, following the exact same pattern as
`#renderTreasuresNavLink`.

## CI Checks

- `source/`: `docker-compose run majora_be pytest` (CI job: backend tests), plus
  `docker-compose run majora_be flake8` / project lint job if configured.
- `frontend/`: `docker-compose run majora_fe npm test`, `docker-compose run majora_fe npm run lint`
  (CI jobs: frontend tests / lint).
- `frontend/`: translation key-parity check script (see `translator.md`) — run via
  `docker-compose run majora_fe npm run <i18n-check-script>` (confirm exact script name in
  `frontend/package.json` / `.circleci/config.yml` during implementation).

## Notes

- No DB migration is needed — `is_staff` already exists on Django's built-in `User` model.
- `email` is **not** unique at the DB level for Django's `User` (only `username` has a unique
  constraint); the existing registration flow (`_validate_unique_email` in
  `source/games/views/auth/_shared.py`) enforces email uniqueness manually. The new
  `StaffUserUpdateSerializer` must do the same, excluding the user's own row from the
  uniqueness check.
- Explicitly do **not** let `is_staff` unlock any pre-existing superuser-only action (Treasures
  create/update, Link/CharacterLink writes, GamePhoto/CharacterPhoto default writes, etc.) — its
  authority is scoped solely to the new `/staff/users*` endpoints and routes.
- No user-creation page and no password/status-flag editing — out of scope per the issue.
- After `backend` finishes, dispatch `data-access` (new endpoints + new serializer fields
  exposing `User` data) and `security` (new endpoints + authentication/authorization logic +
  user input handling in the update endpoint) before opening the PR, per the architect's
  standard review flow.
