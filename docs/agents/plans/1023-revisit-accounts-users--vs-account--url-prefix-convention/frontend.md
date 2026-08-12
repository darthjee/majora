# Frontend Plan: Revisit accounts users/ vs account/ url prefix convention

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes three renamed backend paths (literal strings, no `reverse()`/name
lookup on this side):

| Method | Old path | New path |
|---|---|---|
| POST | `/users/test-email.json` | `/staff/test-email.json` |
| POST | `/users/language.json` | `/account/language.json` |
| GET/PATCH | `/users/account.json` | `/account/account.json` |

No request/response shape changes — only the path strings move.

## Implementation Steps

### Step 1 — Update `AuthClient.js`

In `frontend/assets/js/client/AuthClient.js`, update the three hardcoded
paths:
- Line ~49 (`sendTestEmail`): `/users/test-email.json` → `/staff/test-email.json`
- Line ~104 (`setLanguagePreference`): `/users/language.json` → `/account/language.json`
- Lines ~114 and ~129 (`fetchAccount` / `updateAccount`): `/users/account.json` → `/account/account.json`

Leave every other path in this file unchanged (`login`, `logout`, `status`,
`recover`, `reset-password`, `register`, `authorization_requests`
create/poll/list/deny/authorize all stay as-is).

### Step 2 — Update `skipCacheEndpoints.js`

In `frontend/assets/js/client/config/skipCacheEndpoints.js`, update the two
entries that move:
- `/users/language.json` → `/account/language.json`
- `/users/account.json` → `/account/account.json`

`/users/test-email.json` is not in this Set today (it's a POST action, not a
cached GET) — no entry to add there for the `/staff/...` rename.
`skipCachePrefixes.js` and `HashRouteResolver.js` don't reference any of
these three paths — no changes needed in either file.

### Step 3 — Update specs

Update the hardcoded path expectations in:
- `frontend/specs/assets/js/client/AuthClient/sendTestEmailSpec.js`
- `frontend/specs/assets/js/client/AuthClient/setLanguagePreferenceSpec.js`
- `frontend/specs/assets/js/client/AuthClient/fetchAccountSpec.js`
- `frontend/specs/assets/js/client/AuthClient/updateAccountSpec.js`

to expect the new paths, matching Step 1's changes.

## Files to Change

- `frontend/assets/js/client/AuthClient.js` — update 3 hardcoded endpoint paths
- `frontend/assets/js/client/config/skipCacheEndpoints.js` — update 2 entries
- `frontend/specs/assets/js/client/AuthClient/sendTestEmailSpec.js` — update expected path
- `frontend/specs/assets/js/client/AuthClient/setLanguagePreferenceSpec.js` — update expected path
- `frontend/specs/assets/js/client/AuthClient/fetchAccountSpec.js` — update expected path
- `frontend/specs/assets/js/client/AuthClient/updateAccountSpec.js` — update expected path

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes

- No React component reads these paths directly — they all go through
  `AuthClient`'s methods, so no component-level changes are expected. If any
  turn up during implementation (e.g. a component asserting on a raw path in
  its own spec), update them the same way.
