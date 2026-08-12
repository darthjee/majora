# Issue: Revisit accounts users/ vs account/ url prefix convention

## Description
The `accounts` app's routes mix `users/`, `account/`, and (implicitly) staff
concerns under a single `users/*` prefix without a documented rationale.
This was first noticed on the `authorization_requests` endpoints:

- `users/authorization_requests.json` (create) and
  `users/authorization_requests/<uuid>.json` (poll) use the `users/` prefix.
- `account/authorization_requests.json` (list),
  `account/authorization_requests/<uuid>/deny.json` (deny), and
  `account/authorization_requests/<uuid>/authorize.json` (authorize) use the
  `account/` prefix.

This split was noticed while reorganizing `accounts/urls.py` into a
per-resource `accounts/urls/` package (issue #1022, "Reorganize endpoints and
modules"). That reorg was kept as a pure structural move — it preserves
existing paths as-is — so this prefix inconsistency was deliberately deferred
to this follow-up issue rather than decided as part of #1022.

Investigating the whole `accounts` app (not just `authorization_requests`)
showed the inconsistency is broader: `users/test-email.json`,
`users/language.json`, and `users/account.json` are all post-login,
authenticated endpoints that still sit under `users/*` alongside genuinely
pre-login routes like `users/login.json` and `users/register.json`.

## Problem
Two hypotheses for the `authorization_requests` split were considered and
ruled out:

- **Self-service vs target-user**: every route in the app, including all
  `account/*` ones, is self-service — `authorize`/`deny` operate on the
  caller's own pending login request (`lookup_owned_or_error`), and `list`
  filters by `user=request.user`. No route anywhere in this app lets one
  user act on another user's resource, so this doesn't explain the split.
- **Pre-login vs post-login**: `users/logout.json`, `users/language.json`,
  and `users/account.json` are all post-login (`IsAuthenticated`) yet stay
  under `users/*`, so "post-login moves to `account/*`" isn't consistently
  applied either — this rule alone doesn't hold.

`docs/agents/access-control/principles.md` already documents the intended
target convention: "Account resources" should live under `/account/...`, and
explicitly calls out `/users/account.json` as a **known, tracked gap** — with
the note that it's "tracked here, not fixed by reshuffling routes." So the
drift is already acknowledged institutionally.

The convention that *does* hold, once `users/test-email.json` (staff-gated,
not self-service at all) is treated as its own category: auth/session
lifecycle actions (pre-login, plus `logout` as a session action rather than
account data) stay under `users/*`; endpoints that read/write the caller's
own account data while authenticated belong under `account/*`; staff-only
endpoints belong under `staff/*`.

## Expected Behavior
The following convention is adopted and documented for the `accounts` app:

- **`users/*`** — auth/session-lifecycle actions: pre-login routes
  (`login`, `register`, `status`, `recover`, `reset-password`, and
  `authorization_requests` create/poll) plus `logout` (a session action, not
  account data).
- **`account/*`** — endpoints that read/write the caller's own account data
  while authenticated: `language`, `account` (name/email/password), and the
  existing `authorization_requests` list/deny/authorize.
- **`staff/*`** — staff-only endpoints: `test-email`.

Under this convention, `authorization_requests` itself needs **no path
changes** — its current split (create/poll under `users/*`, list/deny/authorize
under `account/*`) already matches the rule. Three other routes move:
`users/test-email.json` → `staff/test-email.json`,
`users/language.json` → `account/language.json`, and
`users/account.json` → `account/account.json`.

Existing `accounts` app functionality (login, logout, register, status,
recover, reset-password, language, account get/update, test-email,
authorization_requests create/poll/list/deny/authorize) continues to work
end-to-end after the change.

## Solution
- Backend (`backend/accounts/urls/auth.py` and related views/tests):
  - Rename `users/test-email.json` → `staff/test-email.json` (route path and
    `name=` value).
  - Rename `users/language.json` → `account/language.json`.
  - Rename `users/account.json` → `account/account.json`.
  - Update any tests referencing the old paths/URL names under
    `backend/accounts/tests/`.
  - No changes needed to `backend/accounts/urls/authorization_requests.py` —
    its current prefixes already match the adopted convention.
- Frontend:
  - Update the three renamed paths hardcoded in
    `frontend/assets/js/client/AuthClient.js`.
  - Update `frontend/assets/js/client/config/skipCacheEndpoints.js` (and
    `skipCachePrefixes.js` if applicable) for the renamed `/account/...` and
    `/staff/...` paths.
  - Update `frontend/assets/js/utils/routing/HashRouteResolver.js` if it
    references any of the renamed paths.
  - Update associated specs under `frontend/specs/assets/js/client/...`.
- Cache: no `navi/navi_config.yaml` / `navi/resources/*.yml` changes needed —
  none of these endpoints (including the renamed ones) are cache-warmed
  today (all are per-user/private, `X-Skip-Cache`).
- Docs:
  - Update `docs/agents/access-control/principles.md`'s "Known gap" note to
    reflect the adopted convention and that `/users/account.json` and
    `/users/language.json` have moved to `/account/...` (and
    `/users/test-email.json` to `/staff/...`).
  - Update `docs/agents/access-control/endpoints.md` for the three renamed
    paths.

## Benefits
A single, documented, and now-consistently-applied convention for `accounts`
URL prefixes removes ambiguity for future contributors adding routes to this
app, and fully closes the gap already flagged in
`docs/agents/access-control/principles.md` rather than leaving it as tracked
debt.
