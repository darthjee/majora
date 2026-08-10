# Proxy Plan: Use custom cache hash for some restricted endpoints

Main plan: [plan.md](plan.md)

## Shared contracts

- Consumes the `X-Cache-Token` header the frontend sends (sourced from backend's `cache_token` field — see [backend.md](backend.md)) as the private-cache hash's sensitive input.
- Rule matcher targets the exact path `GET /staff/cache/summary.json` — must stay in sync with `backend/staff/urls.py` if that route ever changes.
- Tent's matchers only support method/URI/domain — not header presence — so the new rule unconditionally intercepts every `GET /staff/cache/summary.json` request. A request without `X-Cache-Token` still gets cached, keyed on an empty private-data value, so all header-less callers share one entry. Acceptable here only because this endpoint's response doesn't vary per caller — flagged in Notes below for future adoption on genuinely per-user endpoints.

## Implementation Steps

### Step 1 — New `PrivateRequestHasher` class

New file `proxy/extension/lib/cache/PrivateRequestHasher.php` (namespace `Tent\Cache`), implementing `Tent\Cache\RequestHasher`, following `HeaderAwareRequestHasher`'s documented pattern (`docs/agents/external/tent/creating-request-hashers.md`) and this repo's `DomainHash.php` docblock style:

```php
public function hash(RequestInterface $request): string
{
    $headers = array_change_key_case($request->headers(), CASE_LOWER);
    $token = $headers[strtolower($this->headerName)] ?? '';

    return 'private_' . hash('sha256', $token . '|' . $request->query());
}

public static function build(array $params): self
{
    return new self($params['headerName'] ?? 'X-Cache-Token');
}
```

- Delimiter (`|`) between token and query string is mandatory — closes the concatenation-boundary-ambiguity gap (see issue's "Hash Strategy" section).
- `private_` prefix stays unhashed; the token itself is always hashed, never embedded raw.

Register it in `proxy/extension/loader.php` (`require_once __DIR__ . '/lib/cache/PrivateRequestHasher.php';`, alongside the existing `DomainHash.php` require).

### Step 2 — New rule file

New `proxy/dev_configuration/rules/private_cache.php` (mirrored in `prod_configuration`):

```php
<?php

use Tent\Configuration;

if ($privateCacheEnabled) {
    Configuration::buildRule([
        'handler' => [
            'type' => 'default_proxy',
            'host' => 'http://backend:8080',
            'request_hasher' => [
                'class' => 'Tent\\Cache\\PrivateRequestHasher',
                'headerName' => 'X-Cache-Token',
            ],
        ],
        'matchers' => [
            ['method' => 'GET', 'uri' => '/staff/cache/summary.json', 'type' => 'exact'],
        ],
        'middlewares' => [
            [
                'class' => 'Tent\\Middlewares\\CacheStalenessMiddleware',
                'location' => $cacheFolder,
                'host' => 'http://backend:8080',
                'maxAgeSeconds' => 10,
            ],
        ],
    ]);
}
```

No `skip_cache_header` option — deliberately, per the issue's "X-Skip-Cache Conflict" decision; `staff_cache_summary` keeps sending `X-Skip-Cache: true` unchanged and it has no effect on this rule. No `CacheCleanupMiddleware` — doesn't apply here (see issue's "Cache Staleness" section: its `collection`/`entity` cleanup is keyed off the *mutating* request's own path, never this one).

### Step 3 — Wire the rule into `configure.php`

Both `dev_configuration/configure.php` and `prod_configuration/configure.php`, between `rules/cache.php` and `rules/backend.php`:

```php
require_once __DIR__ . '/rules/cache.php';
require_once __DIR__ . '/rules/private_cache.php';   // new
require_once __DIR__ . '/rules/backend.php';
```

### Step 4 — Kill switch variable

- `dev_configuration/locals.php`: add `$privateCacheEnabled = true;`.
- `prod_configuration/locals.php.sample`: add `$privateCacheEnabled = false;` (or `true` — decide the safer default; the real `prod_configuration/locals.php` is not tracked in git and must be set manually on the server — **call this out explicitly in the PR description** as a manual pre/post-deploy step).

### Step 5 — Tests

New `proxy/extension/tests/cache/PrivateRequestHasherTest.php`, following `DomainHashTest.php`'s structure exactly (a minimal `RequestInterface` double, one assertion method per property):

- Same token + query always produces the same hash (determinism).
- Different `X-Cache-Token` values produce different hashes.
- The delimiter correctly separates boundary-ambiguous concatenations (e.g. token=`"AB"`, query=`"C"` vs token=`"A"`, query=`"BC"` must not collide).
- Missing header (empty headers array) still produces a valid, non-crashing hash (the documented "shared entry for header-less callers" fallback).

Integration check (manual or scripted, run against the real proxy in dev): log in as two distinct users, hit `GET /staff/cache/summary.json` twice each. Since this endpoint's correct response is identical for every caller (`{size, limit}` is process-wide, not per-user), this test validates **cache-file separation by token** (inspect the cache directory: two different `X-Cache-Token` values produce two different `private_`-prefixed files) and **hit/miss plumbing** (second call per token is a cache hit) — not response-content divergence, which wouldn't exist here even with a correctly-working hasher. The stronger cross-user-isolation guarantee is proven at the unit level (Step 5's hasher tests), not by this integration check.

## Files to Change

- `proxy/extension/lib/cache/PrivateRequestHasher.php` — new hasher class
- `proxy/extension/loader.php` — require the new class
- `proxy/dev_configuration/rules/private_cache.php` — new rule
- `proxy/prod_configuration/rules/private_cache.php` — new rule (mirrored)
- `proxy/dev_configuration/configure.php` — require the new rule file
- `proxy/prod_configuration/configure.php` — require the new rule file
- `proxy/dev_configuration/locals.php` — add `$privateCacheEnabled`
- `proxy/prod_configuration/locals.php.sample` — add `$privateCacheEnabled`
- `proxy/extension/tests/cache/PrivateRequestHasherTest.php` — new unit tests

## CI Checks

- `proxy`: `vendor/bin/phpunit --bootstrap /var/www/html/extension/tests/bootstrap.php /var/www/html/extension/tests` (CI job: `proxy_extension_tests`); locally via `docker-compose run proxy_tests`.

## Notes

- Confirm during implementation whether Tent offers any middleware-level way to skip caching when a specific header is *absent* (the inverse of `skip_cache_header`, which only skips when a header is *present*). If it does, prefer it over the empty-token fallback described above for any **future** endpoint that genuinely varies per caller — the empty-token fallback used here is acceptable only because `staff_cache_summary`'s data isn't caller-specific.
- Double-check the safe default for `$privateCacheEnabled` in `prod_configuration/locals.php.sample` — `false` is the conservative choice (opt-in after verifying dev), but confirm with whoever prepares the real prod `locals.php` post-merge.
- `cache` agent (Navi) reviews, read-only, that restricted endpoints set `X-Skip-Cache` — expect it to flag that `staff_cache_summary` is now privately cached despite still sending that header; this is intentional per the issue and doesn't need a code change in response.
