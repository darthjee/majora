# Plan: Skip cache on status endpoint

Issue: [122-skip-cache-on-status-endpoint.md](../issues/122-skip-cache-on-status-endpoint.md)

## Overview

This issue is already fully implemented. The `/users/status.json` endpoint was added to `skipCacheEndpoints.js` in commit `4f9dbec` (PR #88 — "Refactor frontend to backend client"), and the `AuthClientSpec` and `BaseClientSpec` already assert that `X-Skip-Cache: 1` is sent with every call to that endpoint.

## Context

The `BaseClient.request()` method reads from `frontend/assets/js/client/config/skipCacheEndpoints.js`. The set in that file already includes `/users/status.json`, `/users/login.json`, `/users/logout.json`, and `/users/language.json`. The `AuthClientSpec#status` tests already assert that `X-Skip-Cache: 1` appears in the outgoing headers for both the authenticated and unauthenticated cases.

## Implementation Steps

### Step 1 — Verify the acceptance criteria are met

All three acceptance criteria are satisfied by existing code:

1. `GET /users/status.json` requests include `X-Skip-Cache: 1` — covered by `skipCacheEndpoints.js` and exercised by `BaseClientSpec`.
2. `AuthClient#status` spec asserts the header — covered in `AuthClientSpec.js` (two cases: with token, without token).
3. `BaseClientSpec` covers the `/users/status.json` path — the test "matches a configured endpoint by pathname only, ignoring the query string" uses `/users/status.json?foo=bar` and asserts `X-Skip-Cache: 1`.

No code changes are required. The PR will simply close the issue with the plan files as the only change.

## Files to Change

- `docs/agents/plans/122-skip-cache-on-status-endpoint/plan.md` — this plan file (already written)

## Notes

- The implementation was completed as part of the broader PR #88 before this issue was filed.
- No further work is needed.
