# Issue: Cache permissions routes

## Description
The `permissions.json` endpoints (`games/:game_slug/permissions.json`, `treasures/:treasure_id/permissions.json`, `games/:game_slug/pcs/:id/permissions.json`, `games/:game_slug/npcs/:id/permissions.json`) return, for a given entity type, what a user with a given set of roles is allowed to do. The response depends only on the entity **type** and the `?role=` query param(s) — never on the specific entity instance or on `request.user` (all four views are `AllowAny` and never touch the authenticated user).

## Problem
Because each route is nested under a specific entity id (`game_slug`, `treasure_id`, character `id`), two requests that produce byte-identical responses — e.g. `/games/foo/permissions.json?role=player` and `/games/bar/permissions.json?role=player` — are cached under different keys, so the cache never gets reused across entities of the same type, and none of these routes are registered in `.circleci/navi_config.yaml` for proactive warming.

Today, caching for these routes is force-enabled per response via `X-Force-Public-Cache: true` (set in `permissions_response`, backend/games/views/common.py), which `CacheControlMiddleware` (backend/games/middleware.py) reads to pick the public/anonymous `Cache-Control` tier instead of the private tier it would otherwise use for an authenticated caller. That header itself is only consumed internally by this middleware — it has no effect once it leaves Django (Tent and the frontend never look at it) — so it functions as a workaround rather than a real caching signal, and the endpoints should not depend on it going forward.

On the frontend, `BaseClient#shouldSkipCache` (frontend/assets/js/client/BaseClient.js:79-93) already special-cases GET requests whose path ends with `/permissions.json`: it adds `X-Skip-Cache: true` only when no `role` query param is present. Since Tent skips its cache whenever `X-Skip-Cache` is present on either the request or the response, this header must never be sent for a cacheable role-simulated request — and this path-suffix special case will stop matching once the endpoints move to `/permissions/<entity_type>.json`.

## Solution
1. Introduce entity-agnostic permissions endpoints that drop the entity id from the URL, keyed only by entity type, replacing the nested routes entirely:
   - `/games/:game_slug/permissions.json` → `/permissions/game.json`
   - `/treasures/:treasure_id/permissions.json` → `/permissions/treasure.json`
   - `/games/:game_slug/pcs/:id/permissions.json` → `/permissions/game_pc.json`
   - `/games/:game_slug/npcs/:id/permissions.json` → `/permissions/game_npc.json`

   Each still accepts role(s) via `?role=` query params exactly as today; only the entity id leaves the URL. The old nested routes are removed, not kept alongside the new ones.

2. These endpoints must not rely on `X-Force-Public-Cache` or `X-Skip-Cache` to become cacheable. Instead of a per-response header, caching should be forced to the public/anonymous tier directly for the new `/permissions/` path prefix (e.g. by having `CacheControlMiddleware` recognize the prefix itself), regardless of the caller's own auth state.

3. Update the frontend to call the new endpoints, and update `BaseClient#shouldSkipCache`'s permissions special-case (currently matching the `/permissions.json` suffix) so it matches the new `/permissions/<entity_type>.json` paths and never adds `X-Skip-Cache` to them.

4. Register the new endpoints in `.circleci/navi_config.yaml` for proactive cache warming, one entry per entity type for each of these role combinations:
   - no roles
   - `player` + `logged`
   - `dm` + `player` + `logged`
   - `staff` + `player` + `logged`
   - `staff` + `dm` + `player` + `logged`

   Within each combination, order the repeated `role=` query params the same way the frontend does when it builds the query, per `AccessStoreRoles.ROLE_FLAGS` (frontend/assets/js/utils/access/store/AccessStoreRoles.js): `superuser`, `staff`, `dm`, `player`, `owner`, `logged` — filtered to only the roles present in that combination. So, for example, "staff + dm + player + logged" is warmed as `?role=staff&role=dm&role=player&role=logged`.

## Benefits
Collapses what is currently one cache entry per entity instance into a single shared cache entry per (entity type, role combination), makes that public caching actually effective without depending on an internal-only header, and makes these endpoints viable, warmable candidates in `.circleci/navi_config.yaml`.
