# Plan: endpoint /games.json is adding x-skip-cache true

Issue: [1004-endpoint--games-json-is-adding-x-skip-cache-true.md](../../issues/1004-endpoint--games-json-is-adding-x-skip-cache-true.md)

## Overview

Make the per-domain `GET /games.json` (`ENABLE_GAMES_PER_DOMAIN=true`) response
cacheable without introducing a cross-domain cache leak. This requires two changes
that must land together: the backend stops setting `X-Skip-Cache: true` on the
successful `GET` response (leaving it on the 404/`POST` paths), and the proxy finishes
wiring the domain-specific cache location it already computes but never actually uses
for reads/writes.

## Agents involved

- [backend](backend.md)
- [proxy](proxy.md)
- [cache](cache.md)

The `docs/agents/access-control/game.md` doc update is cross-cutting (outside any
specialist's owned directory) and is handled directly by the architect, not delegated —
see Notes below.

## Shared contracts

- **`X-Skip-Cache` header, as the on/off switch for caching**: after the backend change,
  a successful `GET /games.json` response (per-domain mode, recognized host) no longer
  carries `X-Skip-Cache`. The 404 (unrecognized host) and `POST` responses keep
  `X-Skip-Cache: true` — unchanged. The proxy's `default_proxy` handler in
  `rules/games.php` already declares `'skip_cache_header' => 'X-Skip-Cache'`, so once the
  header is absent, `FileCacheMiddleware` treats the response as cacheable — no proxy
  change needed to *observe* this half of the contract, only to actually persist to the
  right location (next point).
- **`$domainCacheLocation`, as the actual cache read/write path**: `rules/games.php`
  already computes `$domainCacheLocation = "$cacheFolder/." . CachePathSanitizer::sanitize($domain, $cacheFolder)`
  per domain and passes it to `CacheCleanupMiddleware`/`CacheStalenessMiddleware`, but
  never to the handler's `'cache'` option — so `FileCacheMiddleware` (auto-attached by
  `default_proxy`) still falls back to the shared `./cache` root. The proxy fix passes
  `'cache' => $domainCacheLocation` on the handler so cache reads/writes actually use
  the per-domain path that cleanup/staleness already assume.
- **`$gamesJsonCacheDomains` (`proxy/prod_configuration/locals.php` in prod), as the set
  of domains this applies to**: production values are `moria.ffavs.net` and
  `rpg.mioloscontaminados.net`. These must match `GameDomain.domain` rows the backend's
  `RegisteredDomainsCache` recognizes — no code change needed here, just noted as the
  boundary the backend's 404 gate and the proxy's per-domain rule both key off of.

## Notes

- `docs/agents/access-control/game.md` ("Domain-scoped listing/creation" section) needs
  its "Both successful and 404 responses in this mode set `X-Skip-Cache: true`" line
  updated to reflect that only the 404/`POST` paths do so now — handled directly by the
  architect since it's outside `backend/`'s owned scope and not owned by any other
  specialist.
