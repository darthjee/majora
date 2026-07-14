# Plan: Fix send test email button

Issue: [478-fix-send-test-email-button.md](../../issues/478-fix-send-test-email-button.md)

## Overview

Restrict the "send test email" control to admin/staff users on both sides: the frontend
header stops rendering the full-text button for regular logged-in users and instead shows
an icon-only, admin/staff-gated control (mirroring the existing "View As" icon pattern),
and the backend endpoint enforces the same admin/staff restriction so a direct API call
from a regular user is rejected with a 403.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- Endpoint: `POST /users/test-email.json` (`backend/games/views/auth/email.py`, function
  `test_email`).
  - Response shapes are unchanged: `{"sent": true}` (200), `{"error": "User has no email
    address configured"}` (400).
  - Permission change: previously any `IsAuthenticated` user could call it; now only users
    where `request.user.is_staff or request.user.is_superuser` is `True` may call it.
    - Unauthenticated caller: `401` with `{"errors": {"detail": ["authentication
      required"]}}` (via `require_authenticated`/`require_staff` in
      `backend/games/views/common.py`).
    - Authenticated but non-staff/non-superuser caller: `403` with `{"errors": {"detail":
      ["not allowed"]}}`.
  - The frontend already only calls this endpoint from the header's send-test-email
    button, which will itself be gated to `state.isSuperUser || state.isStaff` — the two
    layers are independent defenses of the same rule, not coupled in payload shape.
- No new fields, no new endpoints, no i18n key changes (the existing
  `header.send_test_email` translation key is reused verbatim as the icon's
  `title`/accessible text).
