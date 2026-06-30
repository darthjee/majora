# Plan: Fix Authorization Regression

Issue: [220-fix-authorization.md](../issues/220-fix-authorization.md)

## Overview

Fix two regressions introduced by PR #218. First, `CookieTokenAuthentication.authenticate()` must catch `AuthenticationFailed` raised by `super().authenticate()` (token header auth) and fall through to session-cookie auth rather than propagating the exception. Second, `CacheControlMiddleware` must emit `Cache-Control: no-store` on non-2xx responses instead of the current `public, max-age=<n>`.

## Context

PR #218 changed the global auth class from `TokenAuthentication` to `CookieTokenAuthentication`. The new class calls `super().authenticate()` which can raise `AuthenticationFailed` (not return `None`) when a token format is valid but the key no longer exists in the database. Because the exception is not caught, valid session-cookie auth is never attempted, causing all write endpoints and logout to return 401 for users who have a stale `Authorization` header.

Separately, `CacheControlMiddleware` (from PR #214) adds `public, max-age=3600` to every non-cached response regardless of status code, making 401 responses cacheable by any downstream proxy or CDN.

## Implementation Steps

### Step 1 — Fix CookieTokenAuthentication to catch AuthenticationFailed

In `source/games/authentication.py`, import `AuthenticationFailed` from `rest_framework.exceptions` and wrap the `super().authenticate(request)` call in a try/except that catches `AuthenticationFailed` and sets `result = None`, allowing execution to continue to the session-cookie fallback.

### Step 2 — Fix CacheControlMiddleware to set no-store on non-2xx responses

In `source/games/middleware.py`, after the existing `X-Skip-Cache` and health-check guards, add a branch that checks `response.status_code`. Only emit the `public` or `private` headers for 2xx responses. For any other status code, set `Cache-Control: no-store`.

### Step 3 — Add test for stale header token falling through to session auth

In `source/games/tests/authentication_test.py`, add a test that:
- Deletes the user's token so `super().authenticate()` would raise `AuthenticationFailed`
- Stores that (now-deleted) token key in the session alongside a **new** valid token
- Confirms `authenticate()` succeeds via the session (new token) rather than raising

### Step 4 — Add tests for no-store on error responses

In `source/games/tests/middleware_test.py`, add one or more tests that send a request that results in a 401 (or another non-2xx status) and assert the response carries `Cache-Control: no-store`.

## Files to Change

- `source/games/authentication.py` — catch `AuthenticationFailed` from `super().authenticate()` and fall through to session auth
- `source/games/middleware.py` — set `Cache-Control: no-store` on non-2xx responses
- `source/games/tests/authentication_test.py` — add test for stale-header-token fallback to session auth
- `source/games/tests/middleware_test.py` — add test(s) verifying 401 responses carry `no-store`

## CI Checks

- `source/`: `docker-compose run majora_tests poetry run pytest` (CI job: `pytest`)

## Notes

- The stale-token test in Step 3 needs a second token so the session holds a valid key distinct from the deleted one — or it can store the key before deletion and then delete the token, confirming the header path raises while the session path succeeds.
- No migration, no serializer change, no new endpoint — security and data-access review agents are not required.
