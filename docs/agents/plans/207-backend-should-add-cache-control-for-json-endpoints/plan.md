# Plan: Backend should add cache-control for json endpoints

Issue: [207-backend-should-add-cache-control-for-json-endpoints.md](../issues/207-backend-should-add-cache-control-for-json-endpoints.md)

## Overview

Add a `CacheControlMiddleware` to the Django backend that injects a `Cache-Control` response header on all JSON endpoints. The header value depends on whether the request is authenticated: unauthenticated requests get a public, long-lived cache; authenticated requests get a short-lived private cache. Both durations are configurable via environment variables.

## Context

The proxy (Tent) already uses `X-Skip-Cache: true` to suppress its internal cache for certain endpoints (authenticated write endpoints and similar). The new middleware must not add `Cache-Control` when `X-Skip-Cache: true` is already present, and must also skip the health check endpoint (`/health.json`). All other JSON endpoints should receive the header.

## Implementation Steps

### Step 1 — Add two new settings methods to `games/settings.py`

Add `cache_control_anonymous_max_age()` reading `MAJORA_CACHE_CONTROL_ANONYMOUS_SECONDS` (default `3600`) and `cache_control_authenticated_max_age()` reading `MAJORA_CACHE_CONTROL_AUTHENTICATED_SECONDS` (default `10`). Follow the existing pattern: `int(os.environ.get(..., <default>))` inside a `try/except (ValueError, TypeError)` block.

### Step 2 — Create `games/middleware.py` with `CacheControlMiddleware`

Implement a standard Django middleware (callable class with `__init__(self, get_response)` and `__call__(self, request)`):

1. Call `get_response(request)` to get the response.
2. Skip (return as-is) if `response.get('X-Skip-Cache') == 'true'`.
3. Skip if `request.path` ends with `health.json` (or equals `/health.json`).
4. Otherwise, check `request.user.is_authenticated`:
   - Authenticated → `response['Cache-Control'] = f'private, max-age={Settings.cache_control_authenticated_max_age()}'`
   - Unauthenticated → `response['Cache-Control'] = f'public, max-age={Settings.cache_control_anonymous_max_age()}'`
5. Return the response.

### Step 3 — Register the middleware in `majora_project/settings.py`

Insert `'games.middleware.CacheControlMiddleware'` into the `MIDDLEWARE` list immediately after `'django.contrib.auth.middleware.AuthenticationMiddleware'`, so `request.user` is already populated when the middleware runs.

### Step 4 — Write tests for the new settings methods

In `source/games/tests/settings_test.py`, add two new test classes following the existing style:
- `TestSettingsCacheControlAnonymousMaxAge` — tests default (3600), env override, invalid env, empty env.
- `TestSettingsCacheControlAuthenticatedMaxAge` — tests default (10), env override, invalid env, empty env.

### Step 5 — Write tests for the middleware

Create `source/games/tests/middleware_test.py`. Use `pytest.mark.django_db` and Django's test `Client`. Cover:

- Unauthenticated request to a regular endpoint → `Cache-Control: public, max-age=3600`.
- Authenticated request → `Cache-Control: private, max-age=10`.
- Response with `X-Skip-Cache: true` → no `Cache-Control` header added.
- Request to `/health.json` → no `Cache-Control` header added.
- Custom env values via `monkeypatch` are reflected in the header.

## Files to Change

- `source/games/settings.py` — add `cache_control_anonymous_max_age()` and `cache_control_authenticated_max_age()` static methods
- `source/games/middleware.py` — new file: `CacheControlMiddleware`
- `source/majora_project/settings.py` — insert middleware into `MIDDLEWARE` list
- `source/games/tests/settings_test.py` — add test classes for the two new settings methods
- `source/games/tests/middleware_test.py` — new file: middleware tests

## CI Checks

- `source`: `docker-compose run --rm backend pytest source/` (CI job: `pytest`)

## Notes

- The middleware must run after `AuthenticationMiddleware` so that `request.user` is set; placing it immediately after in `MIDDLEWARE` satisfies this.
- The health check exclusion can be done by checking `request.path.endswith('/health.json')` or a simple `== '/health.json'`.
- Do not add `Cache-Control` if it is already present — follow the `X-Skip-Cache` check pattern (do not overwrite an existing header).
