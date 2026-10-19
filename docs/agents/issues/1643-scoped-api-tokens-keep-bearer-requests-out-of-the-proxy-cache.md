# Issue: Scoped API tokens: keep Bearer requests out of the proxy cache

## Description

Part of epic #1592 (Majora client for automations, with fine-grained API tokens). Split out of #1604 during refinement: this is the cache isolation for Bearer requests that [`docs/agents/specs/client/token-api.md`](../specs/client/token-api.md#caching-proxy-and-navi) specifies, under *Caching, proxy and Navi*. It has nothing to do with the token endpoints themselves.

**Blocks #1630–#1639.** It must be merged before any scope-declaration sub-issue opens a view to scoped tokens.

## Problem

`rules/backend.php` caches every `.json` GET, whoever the caller is. `rules/private_game_data_cache.php` ignores `X-Skip-Cache` and keys its entries on `X-Cache-Token`. Once views accept scoped tokens:

- a Bearer response carrying restricted data could be stored and served to other callers;
- a cache hit would skip every Bearer check (401, 403 `token_not_allowed` / `game_not_allowed`);
- a Bearer request without `X-Cache-Token` would share the "empty token" private entry with every header-less caller.

## Expected Behavior

- A Bearer request never reads from or writes to the proxy cache, on any rule. Its writes still clear stale entries (`CacheCleanupMiddleware`, `ResponseCacheClearMiddleware`).
- **Bearer detection** is the same rule in the proxy and the backend: the whole `Authorization` value (several headers joined by commas) matches the case-insensitive `(^|,)\s*bearer(\s|$)`.
- `Token` and cookie requests are cached exactly as before.

## Solution

- **Proxy (`proxy` agent):**
  - `BearerSkipCacheMiddleware` in `proxy/extension/lib/middlewares/`, listed under `prependMiddlewares` so it runs before `FileCacheMiddleware`. On a Bearer request it adds a configurable marker header.
  - `rules/backend.php`: marker `X-Skip-Cache: true`, already honoured through `skip_cache_header`.
  - `rules/private_game_data_cache.php`: its own `skip_cache_header => 'X-Bearer-Request'`, set by the middleware. It also never stores or serves an entry when `X-Cache-Token` is missing or empty.
  - Both `proxy/prod_configuration/rules/` and `proxy/dev_configuration/rules/`. Inbound marker headers are not stripped, because spoofing one only skips the sender's own cache.
- **Backend (`backend` agent):** a Django middleware that adds `X-Skip-Cache: true` and `Cache-Control: no-store` to every response to a Bearer request, whatever the status (including Django-level 404 and 500). It is listed after `games.middleware.CacheControlMiddleware` in `MIDDLEWARE`, so it runs first on the way out. It never reads `X-Bearer-Request`.
- **Navi:** no change. Warm-up requests never carry a Bearer token.
- **Docs:** update `token-api.md` so the caching section points to this issue instead of #1604, and document the middleware wherever proxy and backend caching is described.

### Tests

- **Backend:** responses to Bearer requests (200, 401, 403, 404, 500) carry both headers. `Token` and session responses are unchanged. A forged `X-Bearer-Request` has no backend effect.
- **Proxy (PHPUnit, prod and dev):**
  - The marker is set for every Bearer variant and for a joined `Token x, Bearer y`. It is not set for `Token`, a missing header or other schemes.
  - On both rules, a Bearer GET is never served from or written to the cache.
  - On the private rule, a GET without `X-Cache-Token` is never stored, and a later anonymous GET never receives it.
  - A Bearer POST still triggers cache cleanup.
  - `Token` and cookie GETs are still cached.
  - A forged marker only skips the sender's own cache.

### Reviews

Run the `security` review.
