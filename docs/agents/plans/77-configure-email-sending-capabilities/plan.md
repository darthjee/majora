# Plan: Configure email sending capabilities

Issue: [77-configure-email-sending-capabilities.md](../issues/77-configure-email-sending-capabilities.md)

## Overview
Add Django email configuration (SMTP backend settings) and a template-based email body, plus an authenticated `POST /users/test-email.json` endpoint that sends a test email to the requesting user's own address. The frontend adds a header link, visible only when logged in, that triggers this endpoint.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- **Endpoint**: `POST /users/test-email.json`, requires `Authorization: Token <token>` (`IsAuthenticated`, same pattern as `logout`). No request body needed — the recipient is always `request.user.email`.
  - Success: `200 {"sent": true}`.
  - Failure (user has no email on file): `400 {"error": "User has no email address configured"}`.
- **Header**: `Authorization: Token <token>` required; this request does not need `X-Skip-Cache` since it's a one-off action, not a state read (unlike `login`/`logout`/`status` from issue #73).
- The frontend only renders the "Send test email" link when `loggedIn` is `true` (same `state.loggedIn` already tracked by `Header.jsx`/`HeaderController` from issue #73).

## Implementation Steps

### Step 1 — Backend: email configuration, template, endpoint
See [backend.md](backend.md).

### Step 2 — Frontend: header link
See [frontend.md](frontend.md).

## Notes
- This reuses the token-auth infrastructure (`rest_framework.authtoken`) and the `Header`/`HeaderController`/`HeaderHelper`/`AuthClient` split already introduced by issue #73 — no new auth mechanism is needed.
