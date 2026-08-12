# Issue: Private cache should be under domain

## Description

`proxy/prod_configuration/rules/private_game_data_cache.php` defines the private (per-caller) cache rule for restricted game data endpoints (`GET /games/<slug>/npcs/all.json`, `GET /games/<slug>/pcs/<char_id>/full.json`, `GET /games/<slug>/npcs/<char_id>/full.json`). Unlike `proxy/prod_configuration/rules/backend.php`, it does not scope its cache location per domain.

## Problem

`backend.php` partitions its cache into a `domain_<hash>` subfolder per domain (via `DomainHash::hash(new Request())`), keeping cached responses for different domains isolated on disk. `private_game_data_cache.php`, however, has no `handler.cache` key set (silently defaulting to the flat `./cache`), and points `CacheStalenessMiddleware`'s `location` at the plain `$cacheFolder`. Its private, per-caller cache entries are therefore not domain-partitioned at all.

## Expected Behavior

The private cache for restricted game data endpoints should be partitioned per domain, the same way `backend.php` partitions its own cache — reusing the existing `domain_<hash>` folder derived from the request's domain.

## Solution

Reuse `DomainHash::hash(new Request())` **unchanged** — no new prefix argument. Changing `DomainHash`'s signature/output risks breaking `backend.php`'s `CacheStalenessMiddleware`, which already depends on the current `domain_<hash>` format to locate its cached entries.

In `proxy/prod_configuration/rules/private_game_data_cache.php`:

```php
$privateCacheLocation = "$cacheFolder/" . DomainHash::hash(new Request());
```

(the exact same call `backend.php` makes). Then point **both** of the following at `$privateCacheLocation`, keeping them consistent with each other (per Tent's docs, `FileCacheMiddleware`/`CacheStalenessMiddleware` pairs must share the same `location`):

- `handler.cache` — currently unset on this rule, silently defaulting to the flat `./cache`.
- `CacheStalenessMiddleware`'s `location` — currently the plain `$cacheFolder`.

### Sharing the domain folder with `backend.php`

This means the private cache and the regular backend cache end up under the same `domain_<hash>` folder per domain. This is safe:

- `private_game_data_cache.php` is `require`d before `backend.php` in `configure.php`, and its matcher (`npcs/all.json`, `n?pcs/<id>/full.json`) is a strict subset of backend's generic `.json` catch-all, so those 3 routes are exclusively handled by the private rule and never also match backend's rule.
- Tent organizes cache on disk by request path first (subdirectories), then by the configured `RequestHasher`'s key within that path — so the private routes get their own path-based subdirectories inside the shared domain folder, distinct from whatever `backend.php` caches for other paths. `PrivateRequestHasher`'s `private_` prefix further distinguishes its entries at the leaf level.

### Old cache entries

Existing private-cache entries written under the old flat location become orphaned after this change (nothing cleans them — this rule deliberately has no `CacheCleanupMiddleware`). Given `maxAgeSeconds => 10`, the impact is negligible; no migration/cleanup step is planned.

### Test coverage

No dedicated rule-level integration test exists for either `backend.php` or `private_game_data_cache.php` today — coverage relies on existing unit tests (`DomainHashTest`, `PrivateRequestHasherTest`). Since `DomainHash` itself is unchanged, no new unit tests are required there; verification of the rule change itself happens manually/in CI.

## Benefits

- Matches `backend.php`'s existing domain-partitioning convention, keeping cache layout predictable and consistent across rules.
- No changes to `DomainHash`'s public API/behavior — zero risk to `backend.php`'s `CacheStalenessMiddleware`, which already depends on the current `domain_<hash>` format.
- Private, per-caller cache entries stay isolated per domain without introducing a new folder-naming scheme.
