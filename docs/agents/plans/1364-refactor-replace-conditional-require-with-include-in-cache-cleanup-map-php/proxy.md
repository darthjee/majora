# Proxy Plan: Refactor: replace conditional require with include in cache_cleanup_map.php

Main plan: [plan.md](plan.md)

## Overview

`proxy/extension/lib/configuration/cache_cleanup/cache_cleanup_map.php:15-23` assigns the return value of 9 `require` statements to local variables before merging them into `$cacheCleanupGroups`. Because each include's return value is captured (rather than being a bare side-effect statement), PHPCS's PEAR `IncludingFile` sniff treats these as "conditionally used" includes and flags them for using `require` instead of `include`. All 9 files are always present and always needed — `CacheCleanupMapBuilder::build()` requires every group to build the map — so this is purely a linter/convention fix, not a change in file-availability semantics. Swapping to `include` does not add real resilience to a missing file (a missing file still breaks `array_merge()` downstream with a `TypeError` on the resulting `false` value, just triggered one line later than a missing `require` would), so no new "file may be absent" handling should be introduced.

## Context

From the issue: Codacy's PHP_CodeSniffer scan (`PEAR.Files.IncludingFile`, BestPractice, Info severity) flags the 9 lines. PEAR convention reserves `require`/`require_once` for statements whose failure should be fatal, and `include`/`include_once` for anything else. None of these 9 lines use `_once` variants today, so the replacement should be plain `include` (not `include_once`) to keep the diff minimal and behavior identical.

## Implementation Steps

### Step 1 — Replace require with include on lines 15-23

In `proxy/extension/lib/configuration/cache_cleanup/cache_cleanup_map.php`, change each of the 9 lines from:

```php
$xCacheCleanupGroups = require __DIR__ . '/x.php';
```

to:

```php
$xCacheCleanupGroups = include __DIR__ . '/x.php';
```

for `npcs.php`, `pcs.php`, `treasures.php`, `sessions.php`, `items.php`, `documents.php`, `factions.php`, `possessions.php`, and `games.php`. No other line in the file changes — `array_merge()` and `CacheCleanupMapBuilder::build()` stay untouched.

## Files to Change

- `proxy/extension/lib/configuration/cache_cleanup/cache_cleanup_map.php` — lines 15-23: `require` → `include` for all 9 includes.

## CI Checks

- `proxy`: `vendor/bin/phpcs --standard=proxy/phpcs.xml proxy` (CI job: `proxy_extension_tests`, "Check PHP Lint" step) — confirms the `PEAR.Files.IncludingFile` finding clears.
- `proxy`: `vendor/bin/phpunit --bootstrap proxy/extension/tests/bootstrap.php proxy/extension/tests` (CI job: `proxy_extension_tests`, "Tests" step) — the existing `proxy/extension/tests/configuration/CacheCleanupMapTest.php` loads `cache_cleanup_map.php` and asserts on `$cacheCleanupMap`; it should pass unchanged since all 9 files remain present.

## Notes

- No test changes are needed: the existing `CacheCleanupMapTest.php` already exercises the map built from all 9 groups, which is sufficient to confirm behavior is unchanged with `include`.
- Do not add missing-file fallback/error handling for these includes — the issue is scoped to satisfying the linter convention, not to making the files genuinely optional.
