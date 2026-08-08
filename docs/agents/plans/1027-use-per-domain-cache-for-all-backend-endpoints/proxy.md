# Proxy Plan: Use per domain cache for all backend endpoints

Main plan: [plan.md](plan.md)

## Shared contracts

None produced or consumed at the code level — this agent's per-domain cache folders (`domain_<sha256(domain)>`, from `DomainHash::hash()`) are entirely internal to the Tent proxy. The only cross-agent dependency is behavioral: `infra`'s warmup must actually issue requests against every domain this rule now caches separately, or that domain's cache stays cold after deploy (see main plan's "Shared contracts").

## Implementation Steps

### Step 1 — Add per-domain caching to `backend.php`

Edit `proxy/prod_configuration/rules/backend.php` to mirror `games.php`'s proven pattern:

- Compute `$backendCacheLocation = "$cacheFolder/" . DomainHash::hash(new Request());` at the top of the file (new `use Tent\Cache\DomainHash;` and `use Tent\Models\Request;` statements alongside the existing `use Tent\Configuration;`).
- Add `'cache' => $backendCacheLocation` to the handler array (currently absent).
- Change `CacheCleanupMiddleware`'s `'location'` from `$cacheFolder` to `$backendCacheLocation`.
- Change `CacheStalenessMiddleware`'s `'location'` from `$cacheFolder` to `$backendCacheLocation`.

Everything else in the rule (matcher, `skip_cache_header`, `SetClientIpMiddleware`, `CacheCleanupMiddleware`'s `clear`/`custom` options, `maxAgeSeconds`) stays as-is.

The exact target shape:

```php
<?php

use Tent\Configuration;
use Tent\Cache\DomainHash;
use Tent\Models\Request;

$backendCacheLocation = "$cacheFolder/" . DomainHash::hash(new Request());

Configuration::buildRule([
    'handler' => [
        'type' => 'default_proxy',
        'host' => $backendHost,
        'cache' => $backendCacheLocation,
        'skip_cache_header' => 'X-Skip-Cache'
    ],
    'matchers' => [
        ['uri' => '.json', 'type' => 'ends_with']
    ],
    'middlewares' => [
        [
            'class' => 'Tent\\Middlewares\\SetClientIpMiddleware'
        ],
        [
            'class'    => 'Tent\\Middlewares\\CacheCleanupMiddleware',
            'location' => $backendCacheLocation,
            'clear'    => ['collection', 'entity'],
            'custom'   => $cacheCleanupMap
        ],
        [
            'class' => 'Tent\\Middlewares\\CacheStalenessMiddleware',
            'location' => $backendCacheLocation,
            'host' => $backendHost,
            'maxAgeSeconds' => 10
        ]
    ]
]);
```

### Step 2 — Delete the now-redundant `games.php`

`/games.json` already matches `backend.php`'s `['uri' => '.json', 'type' => 'ends_with']` matcher, so once Step 1 lands, `games.php`'s exact-match rule is fully subsumed (today `games.php` loads *before* `backend.php` in `configure.php`, which is why its more specific rule currently wins for `/games.json`). Delete `proxy/prod_configuration/rules/games.php`.

Remove its `require_once __DIR__ . '/rules/games.php';` line from `proxy/prod_configuration/configure.php:21` (immediately above the existing `rules/backend.php` require), so the deleted file isn't still being loaded.

### Step 3 — Confirm no dev-side equivalent needs touching

`proxy/dev_configuration/rules/backend.php` and `proxy/dev_configuration/` have no `games.php` equivalent today — leave dev configuration untouched (out of scope per the issue).

## Files to Change

- `proxy/prod_configuration/rules/backend.php` — add handler-level `'cache'`, repoint both middlewares' `'location'` to the per-domain hash path
- `proxy/prod_configuration/rules/games.php` — delete
- `proxy/prod_configuration/configure.php` — remove the `require_once __DIR__ . '/rules/games.php';` line (line 21)

## CI Checks

- `proxy/`: `docker-compose run proxy_tests` (CI job: `proxy_extension_tests`) — no new PHPUnit coverage is required (rule files aren't unit-tested directly, same as today for `backend.php`/`games.php`), but the full suite (including `DomainHashTest`, `CacheCleanupMapTest`) must stay green since nothing in `proxy/extension/lib/` changes.
- Lint the touched PHP file: `docker run --rm -v "$PWD":/repo darthjee/tent:0.7.8 sh -c 'php -l /repo/proxy/prod_configuration/rules/backend.php'`

## Notes

- `CacheCleanupMiddleware`/`CacheStalenessMiddleware` (external `darthjee/tent` library) already treat whatever `location` they're given as their own base folder — confirmed working for `games.php`'s single-endpoint pilot, so no library-side change is needed to scope them per domain here.
- Double-check whether `proxy/prod_configuration/` has any other rule file or fixture referencing `games.php` by name (e.g. a comment, a test fixture) before deleting it.
