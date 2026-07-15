# Issue: Unify Cache clearing mapping

## Description
The cache-cleanup group mapping consumed by `CacheCleanupMiddleware` is duplicated verbatim between `proxy/prod_configuration/rules/cache_cleanup_map.php` and `proxy/dev_configuration/rules/cache_cleanup_map.php`. It should be unified into a single, shared source under `proxy/extension/lib`, since that is where shared proxy logic (as opposed to environment-specific configuration) already lives.

## Problem
Because the two files are hand-kept copies, any change to the cache-cleanup groups must be applied twice (once per environment), and nothing enforces that prod and dev stay in sync — a change applied to one and forgotten in the other silently diverges without any test or build step catching it.

## Expected Behavior
Both `prod_configuration` and `dev_configuration` build the same `$cacheCleanupMap` from one shared, single-sourced definition, so there is exactly one place to add, remove, or edit a cache-cleanup group.

## Solution
- Create a new dedicated folder `proxy/extension/lib/configuration/cache_cleanup/` for this configuration (a new `configuration/` category alongside the existing `middlewares/`, `exceptions/`, `support/`, `handlers/` subfolders, since this is config data rather than a class).
- Split the current single `cache_cleanup_map.php` content into several files inside that folder, one per resource family (`npcs`, `pcs`, `treasures`), mirroring the grouping already called out by the existing inline comments.
- Add one entry file, `proxy/extension/lib/configuration/cache_cleanup/cache_cleanup_map.php`, that `require`s the per-resource files, merges their groups, and builds `$cacheCleanupMap` via `Tent\Middlewares\CacheCleanupMapBuilder::build()` — same as today.
- Update `proxy/prod_configuration/configure.php` and `proxy/dev_configuration/configure.php` to `require_once` this new entry file directly, in place of their local `rules/cache_cleanup_map.php` require.
- Delete `proxy/prod_configuration/rules/cache_cleanup_map.php` and `proxy/dev_configuration/rules/cache_cleanup_map.php` — no wrapper files are kept.

## Benefits
- Cache-cleanup groups are defined once, removing the risk of prod/dev drift.
- Keeps `proxy/extension/lib` as the single home for logic and configuration shared across environments.
- Smaller, resource-scoped files are easier to review and extend than one large file.
