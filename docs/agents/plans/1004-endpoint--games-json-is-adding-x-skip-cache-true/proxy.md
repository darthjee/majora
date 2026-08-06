# Proxy Plan: endpoint /games.json is adding x-skip-cache true

Main plan: [plan.md](plan.md)

## Shared contracts

- Relies on the backend no longer sending `X-Skip-Cache: true` on a successful
  per-domain `GET /games.json` response (404 and `POST` still send it, unchanged) — see
  [backend.md](backend.md). No proxy change is needed to react to the header's absence;
  `default_proxy`'s `'skip_cache_header' => 'X-Skip-Cache'` already treats "no header" as
  cacheable.
- Production's `$gamesJsonCacheDomains` (`proxy/prod_configuration/locals.php`, not
  committed — see `.sample`) currently lists `moria.ffavs.net` and
  `rpg.mioloscontaminados.net`. No change needed to this list; just noting it as the set
  of domains that will start actually getting cached once this fix lands.

## Implementation Steps

### Step 1 — Wire `$domainCacheLocation` into the handler's `cache` option

`proxy/prod_configuration/rules/games.php` already computes `$domainCacheLocation` per
domain and passes it to `CacheCleanupMiddleware`/`CacheStalenessMiddleware`, but never to
the `default_proxy` handler itself — so `FileCacheMiddleware` (auto-attached by
`default_proxy` since `'cache'` is left unset) falls back to the default `'./cache'`, the
same shared root `backend.php`'s generic `.json` catch-all rule uses. Add `'cache' =>
$domainCacheLocation` to the handler config:

```php
foreach ($gamesJsonCacheDomains as $domain) {
    $domainCacheLocation = "$cacheFolder/." . CachePathSanitizer::sanitize($domain, $cacheFolder);

    Configuration::buildRule([
        'handler' => [
            'type' => 'default_proxy',
            'host' => $backendHost,
            'cache' => $domainCacheLocation,
            'skip_cache_header' => 'X-Skip-Cache'
        ],
        'matchers' => [
            ['method' => 'GET', 'uri' => '/games.json', 'type' => 'exact', 'domain' => $domain],
        ],
        'middlewares' => [
            // ... unchanged
        ]
    ]);
}
```

This is the piece that makes the backend's header removal safe: each domain in
`$gamesJsonCacheDomains` now reads/writes its own cache directory instead of colliding
on the shared `./cache` root keyed only by query string.

### Step 2 — Confirm rule ordering still gives this rule priority

`proxy/prod_configuration/configure.php` already `require_once`s `rules/games.php`
before `rules/backend.php`, and `games.php`'s matcher is more specific (`'domain' =>
$domain` + exact `/games.json`) than `backend.php`'s generic `.json` catch-all — so the
per-domain rule should still take priority. No change expected here; just verify this
holds after Step 1 (e.g. via the manual check in Notes) since a routing regression would
silently defeat the whole fix.

## Files to Change

- `proxy/prod_configuration/rules/games.php` — add `'cache' => $domainCacheLocation` to
  the `default_proxy` handler inside the `foreach ($gamesJsonCacheDomains as $domain)`
  loop.

## Notes

- No dev-config counterpart: `proxy/dev_configuration/rules/` has no `games.php` — dev
  never registers per-domain game portals, so nothing to change there.
- No automated CI coverage for this file: `proxy_extension_tests` (phpunit) only covers
  `proxy/extension/tests/`, and there's no existing pattern for testing rule config
  files under `rules/`. Verify manually — e.g. via `docker-compose up majora_navi`/local
  proxy stack, curl `/games.json` twice with `Host: rpg.mioloscontaminados.net` (or
  whatever domain is configured locally), and confirm the second response is served from
  `$domainCacheLocation` (check the file appears on disk under that path, not under the
  shared `./cache` root) and that a different `Host` doesn't see the same cached body.
