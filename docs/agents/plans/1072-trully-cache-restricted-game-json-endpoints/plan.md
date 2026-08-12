# Plan: Trully cache restricted game json endpoints

Issue: [1072-trully-cache-restricted-game-json-endpoints.md](../issues/1072-trully-cache-restricted-game-json-endpoints.md)

## Overview

Graduate the private (per-caller) response-caching rule piloted in
`proxy/prod_configuration/rules/private_cache.php` (#949) out of pilot status: rename it,
remove its `$privateCacheEnabled` feature-flag gate so it's always active, drop the test-only
`/staff/cache/summary.json` route, and point it at 3 real restricted `GET /games/...` routes
(`npcs/all.json`, `pcs/<id>/full.json`, `npcs/<id>/full.json`). All work is confined to
`proxy/dev_configuration/` and `proxy/prod_configuration/` — no backend, frontend, or
extension code changes.

## Context

Restricted (DM/owner-gated) `GET` endpoints under `/games/...` unconditionally set
`X-Skip-Cache: true`, so Tent's identity-blind reverse-proxy cache never caches them. The
private-cache mechanism (per-caller cache key via the `X-Cache-Token` header, already sent on
every frontend request — see `frontend/assets/js/client/BaseClient.js`) solves this safely via
`Tent\Cache\PrivateRequestHasher`, but today it's gated behind `$privateCacheEnabled` and only
wired to one pilot route.

Current rule (`proxy/prod_configuration/rules/private_cache.php`, dev variant nearly
identical minus using `'http://backend:8080'` instead of `$backendHost`):

```php
<?php
use Tent\Configuration;

if ($privateCacheEnabled) {
    Configuration::buildRule([
        'handler' => [
            'type' => 'default_proxy',
            'host' => $backendHost,
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
                'host' => $backendHost,
                'maxAgeSeconds' => 10,
            ],
        ],
    ]);
}
```

Target routes (see issue for the full route-selection rationale, including why the 6
`@restricted` `summary/all.json` endpoints are deferred):

- `GET /games/<slug>/npcs/all.json`
- `GET /games/<slug>/pcs/<char_id>/full.json`
- `GET /games/<slug>/npcs/<char_id>/full.json`

## Implementation Steps

### Step 1 — Rename the rule file in both environments

- `git mv proxy/dev_configuration/rules/private_cache.php proxy/dev_configuration/rules/private_game_data_cache.php`
- `git mv proxy/prod_configuration/rules/private_cache.php proxy/prod_configuration/rules/private_game_data_cache.php`
- Update the `require_once` line in both `proxy/dev_configuration/configure.php` and
  `proxy/prod_configuration/configure.php` to point at the new filename.

### Step 2 — Remove the `$privateCacheEnabled` gate

In both renamed rule files:
- Remove the `if ($privateCacheEnabled) { ... }` wrapper — `Configuration::buildRule([...])`
  runs unconditionally at the top level of the file.

Then delete the now-unused variable:
- Delete `$privateCacheEnabled = true;` from `proxy/dev_configuration/locals.php`.
- Delete `$privateCacheEnabled = false;` and its explanatory comment block from
  `proxy/prod_configuration/locals.php.sample`.

(The real, untracked `proxy/prod_configuration/locals.php` on the production server still has
this line manually set — it becomes inert once the gate is removed from the rule file. Not
something this repo can change; note it for whoever next touches the production server, but
it's not a blocker for this change.)

### Step 3 — Replace the matcher

Replace the single `['method' => 'GET', 'uri' => '/staff/cache/summary.json', 'type' => 'exact']`
matcher with one combined `regex` matcher covering all 3 target routes:

```php
'matchers' => [
    [
        'method' => 'GET',
        'pattern' => '#^/games/[^/]+/n?pcs/(all|\d+/full)\.json$#',
        'type' => 'regex',
    ],
],
```

Tent's `exact` matcher is literal-only (no wildcards) so `regex` is required for the
`<slug>`/`<char_id>` segments, unlike the literal pilot route. The pattern also structurally
matches `/games/<slug>/pcs/all.json`, which isn't a real backend route (only `npcs/all.json`
exists) — harmless, the backend 404s it consistently either way.

### Step 4 — Leave the handler/middleware config as-is

No changes needed to `handler` (`default_proxy` + `PrivateRequestHasher` keyed on
`X-Cache-Token`) or `middlewares` (`CacheStalenessMiddleware`, `maxAgeSeconds: 10`) — both
apply equally well to the new routes. Keep `maxAgeSeconds: 10` unchanged (see issue's "Cache
staleness" note); revisit later if it proves too aggressive/lax in practice.

### Step 5 — Rewrite the file's docstring

Update the top-of-file docstring in both renamed files to drop the stale "pilot"/#949-only
framing and the `$privateCacheEnabled` gate reference, and instead:
- Name the 3 routes now covered.
- Keep (updated as needed) the existing rationale notes that still apply: no
  `skip_cache_header` support (now covering multiple routes, not just
  `staff_cache_summary`), and no `CacheCleanupMiddleware` (its collection/entity cleanup is
  keyed off the *mutating* request's own path, which never applies to these GET-only routes).
- Point at this plan / issue #1072 instead of only #949, since #949 is where the mechanism was
  introduced but #1072 is where it went live for real routes.

### Step 6 — Manual verification

There's no automated test suite covering `proxy/{dev,prod}_configuration/rules/*.php` (CI's
`proxy_extension_tests` job only runs `phpunit` against `proxy/extension/tests`, which covers
`PrivateRequestHasher`/`CacheStalenessMiddleware` unit behavior, not this rule wiring). Verify
manually in dev, the same way the pilot was verified per the issue ("we have tested and ...
works"):
- `docker-compose up` the proxy + backend + frontend.
- As a DM/owner, hit each of the 3 routes twice with the same `X-Cache-Token` and confirm the
  second response is served from cache (e.g. via response headers / cache folder inspection).
- Hit the same route with a different `X-Cache-Token` (different caller) and confirm it does
  *not* get the first caller's cached (permission-gated) response.

## Files to Change

- `proxy/dev_configuration/rules/private_cache.php` → renamed to `private_game_data_cache.php`, gate removed, matcher replaced, docstring rewritten
- `proxy/prod_configuration/rules/private_cache.php` → renamed to `private_game_data_cache.php`, gate removed, matcher replaced, docstring rewritten
- `proxy/dev_configuration/configure.php` — update `require_once` path
- `proxy/prod_configuration/configure.php` — update `require_once` path
- `proxy/dev_configuration/locals.php` — remove `$privateCacheEnabled`
- `proxy/prod_configuration/locals.php.sample` — remove `$privateCacheEnabled` + comment

## Notes

- No backend, frontend, or `proxy/extension/` changes — the 3 target routes already set
  `X-Skip-Cache: true` correctly and already receive `X-Cache-Token` from the frontend on every
  request; this issue only changes proxy routing/config.
- `docs/agents/private-cache-candidate-routes.md` (already committed on `main`) inventories
  further private-cache candidates, including the deferred 6 `summary/all.json` routes.
  Verifying/pruning that inventory is called out in the issue as follow-up work, not part of
  this plan's implementation steps — it's a documentation-review task for whenever that
  follow-up is picked up, not a code change here.
