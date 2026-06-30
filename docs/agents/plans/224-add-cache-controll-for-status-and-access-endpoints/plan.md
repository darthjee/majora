# Plan: Add Cache-Control: no-store for Status and Access Endpoints

Issue: [224-add-cache-controll-for-status-and-access-endpoints.md](../issues/224-add-cache-controll-for-status-and-access-endpoints.md)

## Overview

Two backend changes are needed so that the status and all access endpoints return
`Cache-Control: no-store` instead of no header (access endpoints) or a timed header
(status endpoint). The fix is entirely contained within the Django backend.

## Context

`CacheControlMiddleware` currently returns early (without setting any `Cache-Control`
header) when the view sets `X-Skip-Cache: true`. This is the wrong behaviour for
authorization/status endpoints — the response must carry `Cache-Control: no-store` so
no HTTP client or proxy caches the result.

Affected endpoints:
- `/users/status.json` — currently does **not** set `X-Skip-Cache: true`, so it
  receives the default timed header. Must set the flag so the middleware applies
  `no-store`.
- `/games/:slug/access.json`, `/games/:slug/pcs/:id/access.json`,
  `/games/:slug/npcs/:id/access.json`, `/games/:slug/treasures/:id/access.json` — each
  already sets `X-Skip-Cache: true`, but the middleware returns early instead of
  writing `no-store`.

## Implementation Steps

### Step 1 — Update CacheControlMiddleware

In `source/games/middleware.py`, change the early-return branch that handles
`X-Skip-Cache: true`:

```python
# Before
if response.get('X-Skip-Cache') == 'true':
    return response

# After
if response.get('X-Skip-Cache') == 'true':
    response['Cache-Control'] = 'no-store'
    return response
```

This single-line change fixes all four access endpoints at once.

### Step 2 — Add X-Skip-Cache to the status view

In `source/games/views/auth.py`, set `X-Skip-Cache: true` on every response returned
by the `status` view. The two return statements are:

1. `return Response({'logged_in': False})` — unauthenticated path
2. `return Response(payload)` — authenticated path

For both, add `response['X-Skip-Cache'] = 'true'` before returning. Use a local
variable for each `Response(...)` call rather than the two-line inline form, to keep
line length within 100 characters.

### Step 3 — Update the middleware test

In `source/games/tests/middleware_test.py`, the class
`TestCacheControlMiddlewareSkipCache` currently asserts:

```python
assert 'Cache-Control' not in response
```

Change it to:

```python
assert response['Cache-Control'] == 'no-store'
```

### Step 4 — Add status-endpoint cache tests to auth_test.py

In `source/games/tests/auth_test.py`, add a new test class (e.g.
`TestStatusViewCacheControl`) with two cases:
- Unauthenticated call to `/users/status.json` → `Cache-Control: no-store`
- Authenticated call to `/users/status.json` → `Cache-Control: no-store`

## Files to Change

- `source/games/middleware.py` — set `Cache-Control: no-store` when `X-Skip-Cache: true` instead of returning bare
- `source/games/views/auth.py` — add `X-Skip-Cache: true` to both return paths in `status()`
- `source/games/tests/middleware_test.py` — update the skip-cache test to assert `no-store`
- `source/games/tests/auth_test.py` — add `TestStatusViewCacheControl` test class

## CI Checks

- `source/`: `docker-compose run --rm majora_tests poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all`)

## Notes

- No migration, no serializer change, no frontend impact.
- The health-check endpoint (`/health.json`) is handled by a separate branch in the
  middleware and is unaffected.
- The middleware test class name `TestCacheControlMiddlewareSkipCache` should be
  preserved (only its assertion and docstring change).
