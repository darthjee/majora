# Plan: Private cache should be under domain

Issue: [1081-private-cache-should-be-under-domain.md](../issues/1081-private-cache-should-be-under-domain.md)

## Overview

`proxy/prod_configuration/rules/private_game_data_cache.php` (the private, per-caller cache rule for 3 restricted `GET /games/<slug>/...` endpoints) currently caches to a flat, non-domain-scoped location. `proxy/prod_configuration/rules/backend.php` already partitions its own cache per domain via `DomainHash::hash(new Request())`, producing a `domain_<hash>` subfolder under `$cacheFolder`. This plan applies that same, unchanged `DomainHash::hash()` call to the private cache rule, so private cache entries end up domain-scoped too — sharing the `domain_<hash>` folder with `backend.php`'s cache (safe, since the two rules never match the same routes and Tent further partitions by request path within that folder).

## Context

- `DomainHash::hash(RequestInterface $request): string` (`proxy/extension/lib/cache/DomainHash.php`) always returns `'domain_' . hash('sha256', $request->domain())`. It takes **no** prefix argument and this plan does not add one — `backend.php`'s `CacheStalenessMiddleware` already depends on this exact format to locate its cached entries, so its signature/behavior must stay untouched.
- `backend.php` computes `$backendCacheLocation = "$cacheFolder/" . DomainHash::hash(new Request());` and passes it to both `handler.cache` and `CacheStalenessMiddleware`'s `location`.
- `private_game_data_cache.php` currently has **no** `handler.cache` key at all (silently defaults to flat `./cache`, per Tent's `default_proxy` cache docs), and points `CacheStalenessMiddleware`'s `location` at the plain `$cacheFolder` — no domain partitioning today.
- `private_game_data_cache.php` is `require`d before `backend.php` in `proxy/prod_configuration/configure.php`, and its matcher (`GET .../npcs/all.json`, `GET .../n?pcs/<id>/full.json`) is a strict subset of backend's generic `.json` catch-all — so those 3 routes are exclusively handled by the private rule and Tent's rule matching never lets backend.php's rule also claim them.
- `private_game_data_cache.php` deliberately has no `CacheCleanupMiddleware` (its collection/entity cleanup is keyed off the *mutating* request's own path, which never applies to these GET-only routes) — this plan does not add one.
- Per Tent's cache-configuration doc, a `FileCacheMiddleware`/`default_proxy`'s `cache` option and a paired `CacheStalenessMiddleware` must point at the **same** `location` to stay consistent.

## Implementation Steps

### Step 1 — Add domain-scoped location to `private_game_data_cache.php`

In `proxy/prod_configuration/rules/private_game_data_cache.php`, add (mirroring `backend.php`'s pattern):

```php
use Tent\Cache\DomainHash;
use Tent\Models\Request;

$privateCacheLocation = "$cacheFolder/" . DomainHash::hash(new Request());
```

### Step 2 — Point the handler's cache at the new location

Add `'cache' => $privateCacheLocation` to the rule's `handler` array (currently absent, so it silently defaulted to the flat `./cache`).

### Step 3 — Point `CacheStalenessMiddleware` at the same location

Change `CacheStalenessMiddleware`'s `'location' => $cacheFolder` to `'location' => $privateCacheLocation`, so it stays consistent with the handler's cache location from Step 2 (a hard requirement per Tent's docs for `FileCacheMiddleware`/`CacheStalenessMiddleware` pairs).

### Step 4 — Update the file's doc comment

The file's top-of-file docblock currently doesn't mention domain scoping at all. Add a short note explaining the private cache is now domain-scoped the same way as `backend.php`, and that it deliberately shares that `domain_<hash>` folder with `backend.php`'s cache (safe — no route overlap, and Tent partitions further by request path within the folder).

## Files to Change

- `proxy/prod_configuration/rules/private_game_data_cache.php` — add `$privateCacheLocation` (via unchanged `DomainHash::hash(new Request())`), set it as `handler.cache`, and point `CacheStalenessMiddleware`'s `location` at it too. Update the docblock.

## CI Checks

- `proxy/`: `docker-compose run proxy_tests` (CI job: `proxy_extension_tests`) — runs `proxy/extension/tests` via PHPUnit. No new test file is expected (see Notes), but this must still pass since `DomainHashTest`/`PrivateRequestHasherTest` live here.

## Notes

- **No `DomainHash` changes.** The issue originally floated adding a `$prefix` argument to `DomainHash::hash()` (targeting a `domain_private_<hash>` folder), but that was explicitly dropped during refinement to avoid any risk to `backend.php`'s `CacheStalenessMiddleware`, which already depends on the current `domain_<hash>` output format. Do not reintroduce a prefix argument.
- **Sharing the domain folder with `backend.php` is intentional**, not an oversight — see Context above for why it's collision-safe.
- **Old cache entries** written under the previous flat location become orphaned after this change (nothing cleans them, by design — see Context). Given `CacheStalenessMiddleware`'s `maxAgeSeconds => 10` on this rule, the impact is negligible; no migration/cleanup step is planned.
- **No new automated test is planned.** There's no existing rule-level integration test for either `backend.php` or `private_game_data_cache.php` (both are exercised only indirectly, e.g. via `DomainHashTest`/`PrivateRequestHasherTest` unit tests, which are unaffected since `DomainHash` itself doesn't change). If reviewers want stronger confidence, consider a follow-up integration test that boots the proxy rule and asserts `handler.cache` and the middleware's `location` resolve to the same domain-scoped path — flagging this as optional, open scope.
