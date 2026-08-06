# Issue: endpoint /games.json is adding x-skip-cache true

## Description

When `ENABLE_GAMES_PER_DOMAIN` is on (it is in production), `GET /games.json` is scoped
to the requesting `Host`/`X-Forwarded-Host` by `_games_list_per_domain`
(`backend/games/views/games/games_list.py`), which unconditionally sets
`X-Skip-Cache: true` on every response — success, the 404 for an unrecognized domain,
and `POST`. As a result the endpoint is never cached by the Tent proxy, even though the
proxy config (`proxy/prod_configuration/rules/games.php`, `locals.php.sample`'s
`$gamesJsonCacheDomains`) already anticipates domain-partitioned caching for it.

Reproduced live: requesting `https://rpg.mioloscontaminados.net/games.json` correctly
returns that domain's filtered game list (1 game) but still carries `X-Skip-Cache: true`,
so it is never cached.

## Problem

Simply removing the header would not be safe on its own. Tent's proxy cache key is
`sha256(query string)` only — it does not include `Host` — so if two different
game-portal domains hit `/games.json` with identical query params, they would collide on
the exact same cache entry: a real cross-domain data leak (one domain's game list served
to another domain's visitors).

The proxy config already anticipates domain-partitioned caching but never finishes wiring
it up: `proxy/prod_configuration/rules/games.php` builds a `$domainCacheLocation` per
domain (for each entry in `$gamesJsonCacheDomains` — in production, `moria.ffavs.net` and
`rpg.mioloscontaminados.net`) and matches its rule on `'domain' => $domain`, but that
location is only ever passed to `CacheCleanupMiddleware`/`CacheStalenessMiddleware` — never
as the handler's `'cache'` option. So the `default_proxy` handler's auto-attached
`FileCacheMiddleware` falls back to the default `./cache`, the same shared root used by
`backend.php`'s generic `.json` catch-all rule. Net effect today: caching is fully
disabled for this endpoint (safe, but wasteful) rather than truly domain-partitioned.

This is currently documented as intentional in `docs/agents/access-control/game.md`
("Domain-scoped listing/creation"), on the grounds that "the response body now varies by
domain and Tent's file cache does not key on `Host`/`X-Forwarded-Host`" — that reasoning
is accurate for today's proxy wiring, but no longer needs to hold once the fix below lands.

## Expected Behavior

- `GET /games.json` (per-domain mode, successful response) is cacheable, partitioned per
  domain so no domain's game list can leak into another domain's cache entry.
- The 404 (unrecognized domain) response continues to set `X-Skip-Cache: true`.
- The `POST` (create) response continues to set `X-Skip-Cache: true`.
- The non-per-domain path (`ENABLE_GAMES_PER_DOMAIN` off) is unaffected — it was already
  regular/cacheable.

## Solution

Two-part fix, both required together (part 1 alone would be unsafe):

1. **Backend** (`backend/games/views/games/games_list.py`): in
   `_games_list_per_domain`, only set `X-Skip-Cache: true` on the 404
   (unrecognized-domain) and `POST` paths. The successful `GET` response stops setting
   it, so it becomes cacheable.
2. **Proxy** (`proxy/prod_configuration/rules/games.php`): pass
   `'cache' => $domainCacheLocation` on the `default_proxy` handler so
   `FileCacheMiddleware` actually reads/writes from the domain-specific cache directory
   instead of the shared default. This is what makes dropping the header in part 1 safe —
   each domain in `$gamesJsonCacheDomains` gets its own cache, so no cross-domain leak.
   (No dev-config counterpart is needed — `proxy/dev_configuration/rules/` has no
   `games.php`; dev never registers per-domain game portals.)
3. **Docs**: update `docs/agents/access-control/game.md` and `docs/agents/cache-warmer.md`
   to reflect that the per-domain `GET` response is now cacheable (domain-partitioned)
   rather than always skip-cache.

Out of scope:
- Navi warm-up for the per-domain caches (would need multi-domain `clients:`/resource
  config in `navi/`) — the reporter is handling that separately, in parallel. The cache
  still self-populates from organic traffic without it; warming is a pure optimization,
  not a correctness requirement.

## Benefits

- Reduces backend load and latency for `GET /games.json` on the configured game-portal
  domains, matching the caching already in place for the non-per-domain path.
- Closes the gap between the proxy config's stated intent (domain-partitioned caching)
  and what actually happens today (caching fully disabled).
- Keeps the fix safe by design — no cross-domain data leak — rather than trading one bug
  for another.
