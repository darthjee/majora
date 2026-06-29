# Plan: Fix Health Check Loop Cycle

Issue: [202-fix-health-check-loop-cycle.md](../issues/202-fix-health-check-loop-cycle.md)

## Overview

This plan improves the frontend health-check mechanism by reducing polling frequency, adding timeout and 502 error handling, bypassing the proxy cache, exposing a server-status indicator for super users, and pausing polling during long idle periods. It also extends the backend `/users/status.json` endpoint to report whether the authenticated user is a super user.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

### `/users/status.json` response (when `logged_in: true`)

The backend must add an `is_superuser` boolean field to the response payload:

```json
{
  "logged_in": true,
  "username": "...",
  "user_id": 42,
  "is_superuser": true,
  "settings": { "favorite_language": "en" }
}
```

- `is_superuser` is `true` when the authenticated user's Django `User.is_superuser` flag is set, `false` otherwise.
- When `logged_in: false`, the field is absent (the frontend treats its absence as non-superuser).

The frontend reads `data.is_superuser` in `HeaderController.checkStatus()` and propagates it to `Header` state as `isSuperUser`.
