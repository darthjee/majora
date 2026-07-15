# Plan: Unify Cache clearing mapping

Issue: [531-unify-cache-clearing-mapping.md](../../issues/531-unify-cache-clearing-mapping.md)

## Overview

`proxy/prod_configuration/rules/cache_cleanup_map.php` and
`proxy/dev_configuration/rules/cache_cleanup_map.php` are byte-for-byte
duplicates today. This plan moves that shared definition into a new
`proxy/extension/lib/configuration/cache_cleanup/` folder, split across one
file per resource family (`npcs`, `pcs`, `treasures`) plus a single entry
file that assembles `$cacheCleanupMap`, and points both `configure.php`
entry points at it directly, deleting the old duplicated files.

## Context

`CacheCleanupMiddleware` (wired in `rules/backend.php` via its `custom`
option) consumes a flat `[route => targets]` map built by
`Tent\Middlewares\CacheCleanupMapBuilder::build($groups)` — already a shared
class living at `proxy/extension/lib/middlewares/CacheCleanupMapBuilder.php`
and loaded by `proxy/extension/loader.php`. Only the `$groups` data itself
(the `cache_cleanup_map.php` files) is duplicated, not the logic that
processes it. `proxy/extension/lib` is mounted as a sibling of both
`proxy/dev_configuration` (locally, and at
`/var/www/html/extension` / `/var/www/html/configuration` in the `tent`
container) and `proxy/prod_configuration` (uploaded to `extension/` /
`configuration/` on the production server per `.circleci/config.yml`), so a
relative `require_once __DIR__ . '/../extension/...'` from either
`configure.php` resolves correctly in every environment.

## Implementation Steps

### Step 1 — Create the dedicated configuration folder

Create `proxy/extension/lib/configuration/cache_cleanup/` — a new
`configuration/` category alongside the existing `middlewares/`,
`exceptions/`, `support/`, `handlers/` subfolders of `proxy/extension/lib`,
since this holds config data rather than a class.

### Step 2 — Split the groups into per-resource files

Move the group definitions currently in `cache_cleanup_map.php` into three
files inside the new folder, matching the resource-family boundaries already
marked by the existing inline comments:

- `npcs.php` — the `npcs.json` collection group, the npcs entity family
  group, and the npcs-treasures-acquire/sell group (its targets are
  `$npcsEntityTargets`-based).
- `pcs.php` — the pcs entity family group and the pcs-treasures-acquire/sell
  group (targets are `$pcsEntityTargets`-based).
- `treasures.php` — the `treasures.json` collection group, the treasures
  entity group, and the final catch-all "Treasures" group (its targets are
  the global `/treasures.json` / `/treasures/:treasure_id.json` paths, even
  though some of its trigger routes are npc/pc treasure actions).

Each file `return`s its list of groups (the same `['targets' => [...],
'routes' => [...]]` shape used today), so it can be combined with
`array_merge()` by the entry file. Preserve the existing explanatory
comments (including the reference to
`docs/agents/issues/438-reactor-proxy-rules.md`) on each group.

### Step 3 — Add the entry file

Add `proxy/extension/lib/configuration/cache_cleanup/cache_cleanup_map.php`:
it `require`s the three per-resource files, `array_merge()`s their returned
group lists, and calls `Tent\Middlewares\CacheCleanupMapBuilder::build()` on
the combined list to produce `$cacheCleanupMap` — same construction as
today's file, just sourced from the split files. Keep the file-level doc
comment describing what `$cacheCleanupMap` is consumed by.

### Step 4 — Point both configurations at the new entry file

In `proxy/prod_configuration/configure.php` and
`proxy/dev_configuration/configure.php`, replace:

```php
require_once __DIR__ . '/rules/cache_cleanup_map.php';
```

with:

```php
require_once __DIR__ . '/../extension/lib/configuration/cache_cleanup/cache_cleanup_map.php';
```

keeping its position in the require order (before `rules/backend.php`,
which reads `$cacheCleanupMap`).

### Step 5 — Delete the old duplicated files

Delete `proxy/prod_configuration/rules/cache_cleanup_map.php` and
`proxy/dev_configuration/rules/cache_cleanup_map.php` — no wrapper files are
kept, per the resolved scope of this issue.

### Step 6 — Verify the resulting map is unchanged

The split must not change the resulting `$cacheCleanupMap` output. Confirm
by comparing the flattened `route => targets` map built from the new split
files against the map built from the current single file (e.g. a throwaway
PHP script requiring both, or manual diff of the group lists) before
deleting the old files.

## Files to Change

- `proxy/extension/lib/configuration/cache_cleanup/npcs.php` — new, npcs-family groups.
- `proxy/extension/lib/configuration/cache_cleanup/pcs.php` — new, pcs-family groups.
- `proxy/extension/lib/configuration/cache_cleanup/treasures.php` — new, treasures-family groups.
- `proxy/extension/lib/configuration/cache_cleanup/cache_cleanup_map.php` — new entry file, builds `$cacheCleanupMap`.
- `proxy/prod_configuration/configure.php` — require the new entry file instead of `rules/cache_cleanup_map.php`.
- `proxy/dev_configuration/configure.php` — same change as prod.
- `proxy/prod_configuration/rules/cache_cleanup_map.php` — delete.
- `proxy/dev_configuration/rules/cache_cleanup_map.php` — delete.

## CI Checks

- `proxy/extension`: `docker-compose run --rm proxy_tests` (runs `vendor/bin/phpunit extension/tests`; no CI job currently runs this automatically — `.circleci/config.yml` only uploads `proxy/extension` and `proxy/prod_configuration` at deploy time via `upload_proxy_files` / `copy_proxy_configuration`, it doesn't execute the test suite). `CacheCleanupMapBuilderTest.php` already covers the builder's merge behavior with inline groups and needs no changes, since the builder class itself is untouched.

## Notes

- The new files are plain data (no classes), so they are not added to
  `proxy/extension/loader.php` — that file only requires class definitions.
  They are `require`d directly from `configure.php`, matching how
  `cache_cleanup_map.php` is required today.
- No new automated test is strictly required (the moved files contain no
  logic), but Step 6's manual equivalence check is important since a typo
  while splitting the groups would silently change cache-invalidation
  behavior with nothing to catch it in CI.
