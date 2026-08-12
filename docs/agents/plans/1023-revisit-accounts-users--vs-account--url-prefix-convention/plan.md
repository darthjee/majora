# Plan: Revisit accounts users/ vs account/ url prefix convention

Issue: [1023-revisit-accounts-users--vs-account--url-prefix-convention.md](../issues/1023-revisit-accounts-users--vs-account--url-prefix-convention.md)

## Overview

Adopt and apply a three-way URL prefix convention for the `accounts` app:
`users/*` for pre-login/session-lifecycle actions, `account/*` for endpoints
that read/write the caller's own account data while authenticated, and
`staff/*` for staff-only endpoints. `authorization_requests` already matches
this convention and needs no changes. Three routes move: `test-email.json`
(`users/` → `staff/`), `language.json` (`users/` → `account/`), and
`account.json` (`users/` → `account/`) — each a pure path/name rename, no
view or permission logic changes.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

Three renamed endpoints (method, old path → new path, old `name=` → new
`name=`), no other change to request/response shape, status codes, or
permission logic:

| Method | Old path | New path | Old name | New name |
|---|---|---|---|---|
| POST | `/users/test-email.json` | `/staff/test-email.json` | `users-test-email` | `staff-test-email` |
| POST | `/users/language.json` | `/account/language.json` | `users-language` | `account-language` |
| GET/PATCH | `/users/account.json` | `/account/account.json` | `users-account` | `account-account` |

Frontend consumes these paths as literal strings in `AuthClient.js` (no
`reverse()`/name lookup involved), so it only needs the **path** column above,
not the `name=` values. Backend must land the route renames before frontend's
literal-path changes are meaningful end-to-end, but since this is a small,
self-contained rename (no phased rollout, no backward-compat period), the two
sides can be implemented in either order and merged together in one PR.
