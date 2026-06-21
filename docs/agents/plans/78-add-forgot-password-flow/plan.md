# Plan: Add forgot password flow

Issue: [78-add-forgot-password-flow.md](../issues/78-add-forgot-password-flow.md)

## Overview
Add a password-recovery flow: a "forgot password" link in the login modal that switches it to an email-collection form, a backend endpoint that always responds identically (no account-existence leakage) and emails a time-limited single-use recovery token when the email matches a user, and a dedicated recovery page where the user sets a new password using that token.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- **`POST /users/recover.json`** — `AllowAny`. Body `{email}`. Always responds `200 {"sent": true}` regardless of whether the email matches a user — timing and response shape must not leak account existence (the view always does the same amount of work: hash a token, no-op if no user found, otherwise persist + email).
- **`POST /users/reset-password.json`** — `AllowAny`. Body `{token, password}`.
  - Valid, unexpired, unused token: sets the new password, marks the token used (single-use), `200 {"reset": true}`.
  - Invalid, expired, or already-used token: `400 {"error": "Invalid or expired token"}` — same generic message in all three cases, to avoid leaking which failure mode occurred.
- **Recovery email link**: `<frontend-base-url>/#/recover-password?token=<token>` — the frontend reads `token` from the hash query string (same `hashQueryParams` mechanism already used for pagination).
- **Token expiration**: configurable via a new `Settings.password_reset_token_expiration_minutes()` static method on `source/games/settings.py`'s existing `Settings` class, reading `MAJORA_PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES` (default `30`), following the exact pattern already used by `Settings.pagination_size()`.

## Implementation Steps

### Step 1 — Backend: recovery token model + endpoints
See [backend.md](backend.md).

### Step 2 — Frontend: login modal "forgot password" mode + recovery page
See [frontend.md](frontend.md).

## Notes
- The recovery page is reachable while logged out (it's how a user regains access), so it must not depend on `AuthStorage`'s token — it only uses the recovery token from the URL.
