# Issue: Add Cache-Control: no-store for Status and Access Endpoints

## Description
Some endpoints return authorization/status data that must never be cached. The current `CacheControlMiddleware` (from issue #207) either applies timed cache headers or, when a view sets `X-Skip-Cache: true`, returns the response with no `Cache-Control` header at all. These endpoints should instead respond with `Cache-Control: no-store` to prevent any client or intermediary from caching the result.

Affected endpoints:
- `/users/status.json`
- `/games/:game_slug/access.json`
- `/games/:game_slug/pcs/:id/access.json`
- `/games/:game_slug/npcs/:id/access.json`
- `/games/:game_slug/treasures/:id/access.json`

## Problem
The four access endpoints (`game_access`, `game_pc_access`, `game_npc_access`, `treasure_access`) already set `X-Skip-Cache: true` on their responses, which causes the middleware to skip the `Cache-Control` header entirely — so no caching directive is sent to the client.

The `/users/status.json` endpoint does not set `X-Skip-Cache: true`, so it currently receives the default timed `Cache-Control` header (either `private, max-age=10` when authenticated or `public, max-age=3600` when not).

Both cases are wrong for real-time authorization data: a cached authorization decision could allow or deny access incorrectly.

## Expected Behavior
All five endpoints respond with `Cache-Control: no-store`, ensuring no HTTP client or proxy caches the response.

## Solution
Two changes are required:

1. **Update `CacheControlMiddleware`** in `source/games/middleware.py`: instead of returning early when `X-Skip-Cache: true` is present, set `Cache-Control: no-store` and then return. This fixes all four access endpoints (`game_access`, `game_pc_access`, `game_npc_access`, `treasure_access`) at once.
2. **Update the `status` view** in `source/games/views/auth.py`: add `response['X-Skip-Cache'] = 'true'` to the response so the middleware applies `no-store` to it as well.

Tests should be updated/added in `source/games/tests/middleware_test.py` and the relevant view test files to assert that each endpoint carries `Cache-Control: no-store`.

## Benefits
Prevents stale authorization responses from being served by browser caches or intermediary proxies, avoiding security issues where a cached "access granted" or "logged in" response is served after the actual access was revoked.
