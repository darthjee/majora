# Plan: Add my profile page

Issue: [287-add-my-profile-page.md](../../issues/287-add-my-profile-page.md)

## Overview

Let a logged-in user edit their own username, email, and (optionally) password from a new
`/#/my_account` page, reachable via a new icon-only header button shown only while logged in.
Backend exposes a single `GET`/`PATCH /users/account.json` endpoint that always operates on
`request.user` (never a different user id), enforcing unique username/email (excluding the
current user) and optional password change with confirmation.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- New endpoint `GET/PATCH /users/account.json`, authenticated (`IsAuthenticated`, same
  default-authentication pattern as `/users/language.json` and `/users/test-email.json` — no
  explicit `authentication_classes` override, so the frontend calls it with
  `Authorization: Token <token>` exactly like those two).
  - `GET` returns `{"name": <string>, "email": <string>}` for the requesting user (`name` maps
    to `username`).
  - `PATCH` body: `{"name": <string>, "email": <string>, "password": <string, optional>,
    "password_confirmation": <string, optional>}`.
    - `name` and `email` are always required (unlike the existing staff user update endpoint,
      this one is **not** a partial update for those two fields).
    - `password`/`password_confirmation`: both may be omitted or blank together (password stays
      unchanged); if either is non-blank, both must be provided and must match, or the request
      fails with `400`. No current-password re-entry is required.
    - `name` must be unique across all users, excluding the current user; same for `email`.
  - Responses:
    - `200` — updated `{"name": ..., "email": ...}` (same shape as `GET`).
    - `400` — `{"errors": {"name": [...]}}` / `{"errors": {"email": [...]}}` /
      `{"errors": {"password_confirmation": [...]}}`, following the existing
      `validated_or_error`/`serializer.errors` shape used by `/staff/users/<id>.json`.
    - `401` — unauthenticated (standard DRF `IsAuthenticated` response).
  - The endpoint never accepts or looks at any user id — it always acts on `request.user`.

## Implementation Steps (cross-cutting order)

1. `backend` implements the endpoint, serializers, URL, and tests first (see
   [backend.md](backend.md)).
2. `frontend` adds the header button, the `MyAccount` page, and wiring once the contract above
   is available (see [frontend.md](frontend.md)) — can be written/reviewed in parallel with
   backend since the contract is fixed above, but end-to-end exercising needs the backend
   endpoint to exist.

## Files to Change

See the per-agent files ([backend.md](backend.md), [frontend.md](frontend.md)) for the exact
file lists.

## CI Checks

- `source`: `docker-compose run majora_app poetry run pytest --ignore=games/tests/views/ --cov`
  (CI job: `pytest_all`, covers the new `games/tests/auth/account_test.py` and
  `games/tests/serializers/test_my_account_*.py`) and `docker-compose run majora_app poetry run
  ruff check .` (CI job: `checks`)
- `frontend`: `docker-compose run majora_fe npm run coverage` (CI job: `jasmine`),
  `docker-compose run majora_fe npm run lint` (CI job: `frontend-checks`), and
  `docker-compose run majora_fe npm run check_i18n` (CI job: `frontend-checks`) if new
  translation keys are added

## Notes

- `data-access` review is warranted once backend lands: new endpoint + new serializer fields,
  plus authentication logic that must be double-checked to always scope to `request.user`.
- `security` review is warranted once backend lands: new endpoint accepting user input
  (name/email/password) with account-modification side effects (including password changes).
- `docs/agents/access-control.md`'s "Authentication endpoints" table must gain a row for
  `/users/account.json` in the same PR (see [backend.md](backend.md)).
