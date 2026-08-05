# Plan: Add A separated cache for /games.json

Issue: [978-add-a-separated-cache-for--games-json.md](../../issues/978-add-a-separated-cache-for--games-json.md)

## Overview

Add a prod-only Tent proxy rule file, `prod_configuration/rules/games.php`, that builds one cached
proxy rule per domain for `GET /games.json`, using Tent's built-in `domain` request matcher so each
domain gets its own cache folder (`$cacheFolder/.$domain`) instead of sharing the generic `.json`
catch-all rule's cache.

## Context

`/games.json` is currently only matched by the generic catch-all in `rules/backend.php`
(`['uri' => '.json', 'type' => 'ends_with']`), whose `CacheStalenessMiddleware` caches by URI only
— not by `Host`. The backend already serves different game lists per domain
(`ENABLE_GAMES_PER_DOMAIN`), so two domains hitting `/games.json` currently risk being served each
other's cached response.

The vendored Tent version (`darthjee/tent:0.10.1`, pinned in `docker-compose.yml`) already supports
matching a request's `Host` via a `'domain'` key in a rule's `matchers` array (confirmed against
`Tent\Matchers\RequestMatcher`/`ExactRequestMatcher` — `%` wildcard, port-stripped,
case-insensitive). This is unrelated to the `'host'` key used elsewhere in these rule files, which
configures the *upstream* backend host inside `'handler'`.

`prod_configuration/configure.php` `require_once`s rule files in an explicit, order-significant
list — first-match-wins. The new file must be required **before** `rules/backend.php`, or its
generic `.json` catch-all wins first and the domain-specific rules never get a chance to match.

## Implementation Steps

### Step 1 — Add the domain list to `locals.php.sample`

In `proxy/prod_configuration/locals.php.sample`, add a new array:

```php
$gamesJsonCacheDomains = [
    'game-a.example.com',
    'game-b.example.com',
];
```

A plain array of domain strings is sufficient — nothing about the rule needs per-domain overrides
today (backend host, cache folder base, and `maxAgeSeconds` all stay shared globals). This is
prod-only; `dev_configuration/` does not need an equivalent.

### Step 2 — Add a small cache-path sanitizer helper

`$domain` is admin-configured (not attacker-controlled at request time), but should still be
defended in depth before being interpolated into a filesystem path, consistent with the existing
pattern in `proxy/extension/lib/support/`:

- `SecurePhotoStorage::assertWithinBase()` — string-level `.`/`..`/absolute-path containment check
  (private, upload-scoped, can't be reused directly as-is).
- `PathTraversalGuard::assertRealPathWithinBase()` — public, filesystem-level/symlink-aware
  re-check, runs once the target exists on disk.

Since `SecurePhotoStorage`'s string-level check is private and scoped to the upload flow, extract a
small, reusable class (e.g. `Tent\RequestHandlers\CachePathSanitizer` in
`extension/lib/support/CachePathSanitizer.php`) that validates a domain string resolves to a safe,
single-segment path component (reject `/`, `..`, and anything else that isn't a plausible domain
character) before it's used to build `"$cacheFolder/.$domain"`, and calls
`PathTraversalGuard::assertRealPathWithinBase()` once the directory exists — same defense-in-depth
shape as `SecurePhotoStorage`, without duplicating its upload-specific logic. Add PHPUnit coverage
under `extension/tests/support/CachePathSanitizerTest.php`, following the existing test style for
that folder (e.g. `extension/tests/support/PathTraversalGuardTest.php` if present, or the closest
sibling).

### Step 3 — Add `prod_configuration/rules/games.php`

```php
<?php

use Tent\Configuration;

foreach ($gamesJsonCacheDomains as $domain) {
    $domainCacheLocation = "$cacheFolder/." . CachePathSanitizer::sanitize($domain);

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
                'location' => $domainCacheLocation,
                'clear'    => ['collection', 'entity'],
                'custom'   => $cacheCleanupMap
            ],
            [
                'class' => 'Tent\\Middlewares\\CacheStalenessMiddleware',
                'location' => $domainCacheLocation,
                'host' => $backendHost,
                'maxAgeSeconds' => 10
            ]
        ]
    ]);
}
```

`CacheCleanupMiddleware` is configured per-rule (not globally), so it's included inside the same
per-domain loop as `CacheStalenessMiddleware`, mirroring `backend.php`'s existing
`'clear' => ['collection', 'entity']` / `'custom' => $cacheCleanupMap` setup — otherwise a write
elsewhere could leave a domain's `games.json` cache stale.

Exact method name/shape of `CachePathSanitizer` is an implementation detail for whoever writes this
— the class just needs to exist and be applied before `$domain` is interpolated into `'location'`.

### Step 4 — Wire the new rule file into `configure.php`

In `proxy/prod_configuration/configure.php`, add:

```php
require_once __DIR__ . '/rules/games.php';
```

Placed after `require_once __DIR__ . '/../extension/lib/configuration/cache_cleanup/cache_cleanup_map.php';`
(so `$cacheCleanupMap` is defined) and strictly **before**
`require_once __DIR__ . '/rules/backend.php';` (so the domain-specific rules get first refusal on
`/games.json` before the generic `.json` catch-all).

A request for `/games.json` from a domain absent from `$gamesJsonCacheDomains` simply falls through
to `backend.php`'s generic rule unchanged — no special handling needed for that case.

## Files to Change

- `proxy/prod_configuration/locals.php.sample` — add `$gamesJsonCacheDomains` array.
- `proxy/prod_configuration/rules/games.php` — new file, one cached rule per domain.
- `proxy/prod_configuration/configure.php` — `require_once` the new rule file before `rules/backend.php`.
- `proxy/extension/lib/support/CachePathSanitizer.php` — new file, domain-to-path-segment sanitizer.
- `proxy/extension/tests/support/CachePathSanitizerTest.php` — new file, PHPUnit coverage for the sanitizer.

## CI Checks

- `proxy/extension`: `vendor/bin/phpunit --bootstrap proxy/extension/tests/bootstrap.php proxy/extension/tests` (CI job: `proxy_extension_tests`)

## Notes

- `rules/*.php` config files themselves have no dedicated test coverage in this repo (only
  `extension/` classes do) — consistent with existing rules (`backend.php`, `cache.php`, etc.), so
  `games.php` and `configure.php`'s new `require_once` line don't need new tests beyond
  `CachePathSanitizer`'s.
- This is a proxy-rule change touching request matching and caching; a security review pass is
  recommended given the `security` agent's stated scope covers "proxy rule changes."
- Dev/prod parity was explicitly ruled out during issue discussion — `dev_configuration/` is
  intentionally left untouched.
