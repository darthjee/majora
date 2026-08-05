# Issue: Add A separated cache for /games.json

## Description

Add a separate rule file for the proxy's `/games.json` endpoint that caches responses independently per domain, instead of relying on the generic `.json` catch-all rule that caches by URI only.

## Problem

`/games.json` is currently matched by the generic catch-all rule in `rules/backend.php` (`['uri' => '.json', 'type' => 'ends_with']`), which caches responses via `CacheStalenessMiddleware` keyed by URI only — not by `Host`/domain. The backend already supports per-domain game lists (`ENABLE_GAMES_PER_DOMAIN`, see `backend/games/tests/views/games/games_list_test.py`), so two different domains hitting `/games.json` risk being served each other's cached response.

## Expected Behavior

Each domain configured in `$gamesJsonCacheDomains` gets its own dedicated proxy rule and its own cache location (`$cacheFolder/.$domain`) for `/games.json`, so its cached response can never be served to, or overwritten by, a different domain. Domains not in the list keep falling through to the existing shared-cache behavior on `rules/backend.php` (unchanged, and not a concern for this issue).

## Solution

Add `prod_configuration/rules/games.php`, building one `Configuration::buildRule([...])` per domain in a new `$gamesJsonCacheDomains` array (`prod_configuration/locals.php.sample`, and thus `locals.php` in production). Prod-only — `dev_configuration/` does not need this.

### Domain matching

Tent's `RequestMatcher` (vendored version `0.10.1`, pinned in `docker-compose.yml`) already supports matching a request's `Host` via a `'domain'` key in the `matchers` array (not `'host'` — that key is reserved for the upstream backend host inside `'handler'`).

### Rule ordering

`prod_configuration/configure.php` `require_once`s rule files in explicit, order-significant sequence — rules are evaluated first-match-wins. `rules/games.php` must be required **before** `rules/backend.php`, since `backend.php`'s generic catch-all (`['uri' => '.json', 'type' => 'ends_with']`) would otherwise swallow `/games.json` requests first.

### `locals.php` domain list shape

Plain array of domain strings — nothing about the rule needs per-domain overrides today (backend host, cache folder base, and `maxAgeSeconds` all stay shared globals):

```php
// locals.php.sample
$gamesJsonCacheDomains = [
    'game-a.example.com',
    'game-b.example.com',
];
```

### Cache path safety

Sanitize `$domain` before it's used to build the per-domain cache location. Reuse the existing defense-in-depth pattern already established in `extension/lib/support/`: a string-level containment check (as `SecurePhotoStorage::assertWithinBase()` does before the target exists on disk) plus, once the directory actually exists, `PathTraversalGuard::assertRealPathWithinBase()` for the filesystem-level/symlink-aware re-check.

### Cache cleanup interaction

`CacheCleanupMiddleware` is configured per-rule (not globally), so it goes inside the same per-domain loop as `CacheStalenessMiddleware`, pointed at that domain's own `'location' => "$cacheFolder/.$domain"` — mirroring `backend.php`'s existing `'clear' => ['collection', 'entity']` / `'custom' => $cacheCleanupMap` setup, so a write elsewhere doesn't leave a domain's `games.json` cache stale.

### Full rule

```php
foreach ($gamesJsonCacheDomains as $domain) {
    Configuration::buildRule([
        'handler' => [
            'type' => 'default_proxy',
            'host' => $backendHost,
            'skip_cache_header' => 'X-Skip-Cache'
        ],
        'matchers' => [
            ['method' => 'GET', 'uri' => '/games.json', 'type' => 'exact', 'domain' => $domain],
        ],
        'middlewares' => [
            [
                'class' => 'Tent\\Middlewares\\SetClientIpMiddleware'
            ],
            [
                'class'    => 'Tent\\Middlewares\\CacheCleanupMiddleware',
                'location' => "$cacheFolder/.$domain",
                'clear'    => ['collection', 'entity'],
                'custom'   => $cacheCleanupMap
            ],
            [
                'class' => 'Tent\\Middlewares\\CacheStalenessMiddleware',
                'location' => "$cacheFolder/.$domain",
                'host' => $backendHost,
                'maxAgeSeconds' => 10
            ]
        ]
    ]);
}
```

`rules/games.php` must be `require_once`d in `prod_configuration/configure.php` before `rules/backend.php`. Domain sanitization should be applied to `$domain` before it's interpolated into `'location'`.

## Benefits

- Prevents cross-domain cache leakage/staleness for `/games.json`.
- Reuses existing, already-vetted mechanisms (Tent's `domain` matcher, the `SecurePhotoStorage`/`PathTraversalGuard` path-safety pattern, `CacheCleanupMiddleware`) rather than inventing new ones.
