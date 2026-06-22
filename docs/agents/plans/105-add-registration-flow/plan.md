# Plan: Add registration flow

Issue: [105-add-registration-flow.md](../issues/105-add-registration-flow.md)

## Overview

The backend already exposes a minimal `users/register.json` endpoint and a `users/login.json` /
`UserProfile` flow, but registration accepts arbitrary extra fields, has no email format/uniqueness
gating beyond username, sends no welcome email, and does not log the user in. This plan extends the
existing endpoint to validate name/email/password/password-confirmation strictly, auto-login on
success, and send a gated welcome email. On the frontend, a new `/#/users/register` page is added
(mirroring the existing `RecoverPassword` page), with links from the login modal and the header for
logged-out users. A new `EMAILS_ENABLED` environment variable gates all outgoing email (welcome,
password reset, test email) and is registered in the dev env sample.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)
- [infra](infra.md)

## Shared contracts

### `POST /users/register.json`

Request body (only these fields accepted; any other field present results in `400`):
```json
{
  "name": "string, required",
  "email": "string, required, valid email format, unique",
  "password": "string, required",
  "password_confirmation": "string, required, must equal password"
}
```
`name` is stored as the Django `User.username` (existing convention — `login.json` already
authenticates by `username`/`password`, there is no separate display-name field on the user model).

Responses:
- `201` on success: `{"username": "<name>", "token": "<auth token>"}` — the same token shape returned
  by `users/login.json`, so the frontend can reuse its existing "store token, fire `AuthEvents`" login
  flow to achieve auto-login after registration.
- `400` with `{"error": "<message>"}` on validation failure (missing field, invalid email format,
  duplicate email/username, password/confirmation mismatch, or unexpected extra field).

### `EMAILS_ENABLED` environment variable

- Read by the backend via `games.settings.Settings.emails_enabled()` (boolean, defaults to `False`
  when unset or any value other than the literal string `true`).
- Gates **all** outgoing email sends: the new welcome email, the existing password-reset email, and
  the existing test email. When disabled, `send_mail` is never invoked (no-op), but endpoints still
  return their existing success responses.
- Declared in `.env.dev.sample` (infra) and consumed only by backend code.

### Frontend route

- New page key `register` resolved from hash path `/users/register` by `HashRouteResolver`, rendering
  a new `Register` page component (frontend-only; no contract with other agents beyond the API shape
  above).
