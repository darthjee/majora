# Proxy Plan: /games.json is still adding x-skip-cache true

Main plan: [plan.md](plan.md)

## Shared contracts

- The backend is removing its `GAMES_JSON_CACHE_DOMAINS` setting/env var entirely. `$gamesJsonCacheDomains` here no longer has anything to "stay in sync" with — it's now a purely proxy-side config. This is a documentation-only consequence; no functional change to `rules/games.php` or `rules/backend.php` is required or expected.

## Implementation Steps

### Step 1 — Update the `$gamesJsonCacheDomains` comment

In `proxy/prod_configuration/locals.php.sample`, the comment block currently reads:

```php
// Domains that get their own dedicated cache for GET /games.json, keyed by
// domain instead of sharing the generic `.json` catch-all cache in
// rules/backend.php (keyed by URI only). See rules/games.php.
//
// IMPORTANT: must be kept in sync with the backend's `GAMES_JSON_CACHE_DOMAINS`
// env var (comma-separated, parsed in `backend/majora_project/settings.py`) —
// the backend only omits `X-Skip-Cache` for a successful GET when the host is in
// that env var. A domain listed here but missing from the backend's env var is
// safe (just uncached); the reverse (in the backend's env var but not here) is a
// cross-domain cache leak, since the proxy would then cache that domain's
// response in the shared, unpartitioned cache root. Always add a domain to both
// together, proxy first, then the backend env var, then redeploy both.
$gamesJsonCacheDomains = [
    'game-a.example.com',
    'game-b.example.com',
];
```

Replace the `IMPORTANT` paragraph — the backend no longer has a `GAMES_JSON_CACHE_DOMAINS` env var to stay in sync with, since `GET /games.json` never sets `X-Skip-Cache` regardless of domain. The remaining real constraint is purely proxy-side: a domain that receives traffic (i.e. Apache forwards it here) but is missing from this array falls through to `rules/backend.php`'s shared, non-partitioned cache instead of getting its own. New wording:

```php
// Domains that get their own dedicated cache for GET /games.json, keyed by
// domain instead of sharing the generic `.json` catch-all cache in
// rules/backend.php (keyed by URI only). See rules/games.php.
//
// This is a proxy-only concern — the backend never sets X-Skip-Cache on a
// successful GET /games.json, regardless of domain. A domain that Apache
// forwards here but that is missing from this array falls through to
// rules/backend.php's shared, unpartitioned cache instead of getting its own.
// Add a domain here before Apache starts forwarding it.
$gamesJsonCacheDomains = [
    'game-a.example.com',
    'game-b.example.com',
];
```

No change to `rules/games.php` or `rules/backend.php` — their behavior is already correct (verified against the pinned `darthjee/tent:0.10.1` source: each domain gets its own real, independently-matched Tent rule).

## Files to Change

- `proxy/prod_configuration/locals.php.sample` — replace the outdated sync-with-backend-env-var comment, per Step 1.

## Notes

- This is a comment-only change; no test coverage exists or is needed for a `.sample` config file's documentation.
