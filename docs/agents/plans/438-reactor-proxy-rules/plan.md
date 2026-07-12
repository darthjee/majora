# Plan: Reactor proxy rules

Issue: [438-reactor-proxy-rules.md](../../issues/438-reactor-proxy-rules.md)

## Overview

Extract the inline `custom` cache-cleanup mapping out of `proxy/prod_configuration/rules/backend.php` and `proxy/dev_configuration/rules/backend.php` into a new per-configuration `rules/cache_cleanup_map.php` file. Deduplicate the mapping by defining named target-path groups (one per resource family: `npcs`, `pcs`, `treasures`) and a list of trigger routes per group, then flatten that into the route → targets map `CacheCleanupMiddleware`'s `custom` option expects using a new `CacheCleanupMapBuilder` class in `proxy/extension/lib`, covered by a PHPUnit test.

## Context

`backend.php` currently inlines a large `custom` array mapping ~13 trigger routes to their cache-target lists. Several routes across the `npcs`, `pcs`, and `treasures` families repeat the exact same 2-, 4-, or 5-path target list verbatim (see issue for the concrete duplication). `proxy/prod_configuration` and `proxy/dev_configuration` are independent configurations (production vs. development) — duplicating the new rules file between them is expected and acceptable; the goal is only to remove duplication *within* each file's own mapping.

## Implementation Steps

### Step 1 — Add `CacheCleanupMapBuilder` to `proxy/extension/lib`

Create `proxy/extension/lib/CacheCleanupMapBuilder.php`. There is no PSR-4 autoloading — `proxy/extension/lib` classes are namespaced by role (`Tent\Middlewares`, `Tent\RequestHandlers`) and each explicitly required from `proxy/extension/loader.php`; pick whichever existing namespace fits best (likely `Tent\Middlewares`, since this builder only exists to feed `CacheCleanupMiddleware`'s `custom` option) and add a `require_once __DIR__ . '/lib/CacheCleanupMapBuilder.php';` line to `proxy/extension/loader.php` alongside the other `require_once` lines. Add a static `build(array $groups): array` method:

- Input shape, one entry per group:
  ```php
  [
      'targets' => ['/games/:game_slug/npcs.json', '/games/:game_slug/npcs/all.json', ...],
      'routes'  => ['/games/:game_slug/npcs/:character_id.json', '/games/:game_slug/npcs/:character_id/slain.json', ...],
  ]
  ```
- Output: a flat `[route => targets]` array suitable for `CacheCleanupMiddleware`'s `custom` option — for every group, every route in `routes` maps to that group's `targets` list.
- If the same route appears in more than one group, later groups win (last one processed overwrites) — document this in a short PHPDoc comment; no need to guard against it since the caller fully controls the input.

### Step 2 — Unit test the builder

Add `proxy/extension/tests/CacheCleanupMapBuilderTest.php` (follow the structure of `CacheControlMiddlewareTest.php`/`TestHeaderMiddlewareTest.php`). Cover:
- A single group with multiple routes all mapping to the same targets.
- Multiple groups producing a merged flat map.
- Empty `groups` input producing an empty map.

### Step 3 — Extract the mapping in `prod_configuration`

Create `proxy/prod_configuration/rules/cache_cleanup_map.php`:
- `use` the namespace chosen for `CacheCleanupMapBuilder` in Step 1 (e.g. `use Tent\Middlewares\CacheCleanupMapBuilder;`).
- Define one group array per resource family (`npcs`, `pcs`, `treasures`) reproducing the exact current target lists from `proxy/prod_configuration/rules/backend.php`'s `custom` key.
  - The `npcs.json` route (2 targets) and the `treasures.json`/`treasures/:treasure_id.json` routes need their own groups since their target lists differ from the shared 4-/5-path family lists.
  - The treasures `acquire`/`sell` routes (both `npcs` and `pcs` variants) get their own groups extending the base family list with the extra `.../treasures.json` target, per the issue's "Important" note on not repeating whole lists.
- Call `$cacheCleanupMap = CacheCleanupMapBuilder::build($groups);` and export `$cacheCleanupMap`.
- Require this new file from `proxy/prod_configuration/configure.php` (add a `require_once __DIR__ . '/rules/cache_cleanup_map.php';` line before the existing `rules/backend.php` require, since `backend.php` will consume `$cacheCleanupMap`).
- Update `proxy/prod_configuration/rules/backend.php`: replace the inline `'custom' => [ ... ]` block with `'custom' => $cacheCleanupMap`, removing the now-unused inline array.

### Step 4 — Extract the mapping in `dev_configuration`

Repeat Step 3 for `proxy/dev_configuration`: new `proxy/dev_configuration/rules/cache_cleanup_map.php` with the same groups (dev's `backend.php` currently has an identical `custom` mapping to prod's, aside from the `$backendHost` vs. hardcoded host difference — that difference is untouched by this issue), require it from `proxy/dev_configuration/configure.php`, and update `proxy/dev_configuration/rules/backend.php` the same way. Duplication of `cache_cleanup_map.php` between `prod_configuration` and `dev_configuration` is intentional (per the issue).

### Step 5 — Verify behavior is unchanged

Confirm the flattened `$cacheCleanupMap` produced in each configuration is *exactly* the same route → targets mapping as the original inline `custom` array it replaces (same keys, same target lists, same order not required since it's an associative array). This is a pure refactor — no route or target list should change.

## Files to Change

- `proxy/extension/lib/CacheCleanupMapBuilder.php` — new, group → flat map builder.
- `proxy/extension/loader.php` — require the new class file.
- `proxy/extension/tests/CacheCleanupMapBuilderTest.php` — new, PHPUnit coverage for the builder.
- `proxy/prod_configuration/rules/cache_cleanup_map.php` — new, defines `$cacheCleanupMap` for prod.
- `proxy/prod_configuration/configure.php` — require the new rules file before `rules/backend.php`.
- `proxy/prod_configuration/rules/backend.php` — replace inline `custom` array with `$cacheCleanupMap`.
- `proxy/dev_configuration/rules/cache_cleanup_map.php` — new, defines `$cacheCleanupMap` for dev.
- `proxy/dev_configuration/configure.php` — require the new rules file before `rules/backend.php`.
- `proxy/dev_configuration/rules/backend.php` — replace inline `custom` array with `$cacheCleanupMap`.

## Notes

- No CI job currently runs the `proxy/extension` PHPUnit suite (checked `.circleci/config.yml`); run it locally, e.g. `cd proxy/extension && ./vendor/bin/phpunit`.
- Keep `proxy/prod_configuration` and `proxy/dev_configuration` fully independent per the issue's "Important" note — do not attempt to share `cache_cleanup_map.php` between them via a symlink or common include path.
