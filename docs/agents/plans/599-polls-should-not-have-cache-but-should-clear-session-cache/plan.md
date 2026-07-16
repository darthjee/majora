# Plan: Polls should not have cache but should clear session cache

Issue: [599-polls-should-not-have-cache-but-should-clear-session-cache.md](../../issues/599-polls-should-not-have-cache-but-should-clear-session-cache.md)

## Overview
Add a new proxy cache-cleanup group so that closing a poll (`PATCH /games/:game_slug/polls/:id/close.json`) clears every cached session list/detail response for the game. This is needed because closing a poll linked to a `GameSession` (a "date poll") overwrites that session's `date` via `GameSessionCloseProcessor`, but nothing currently invalidates the proxy's cached session responses.

## Context
- All poll endpoints (list, detail, votes, close) already set `X-Skip-Cache: true` (added in issues #536/#548/#557/#571) — no work needed there, the proxy already skips caching them via `skip_cache_header` in `rules/backend.php`.
- `backend/games/poll_close_processors/session_close_processor.py`'s `GameSessionCloseProcessor.process` parses the winning option as an ISO date and saves it to `GameSession.date` when a session-linked poll is closed.
- The proxy has no cache-cleanup rule wired for the poll `close.json` route, so cached `sessions` responses keep serving the pre-close date until they naturally expire.
- `proxy/extension/lib/configuration/cache_cleanup/cache_cleanup_map.php` merges per-resource-family group files (`npcs.php`, `pcs.php`, `treasures.php`) via `CacheCleanupMapBuilder::build()`, which flattens each group's `routes` → `targets` pairing into one map. There is no existing `sessions`-targeting group and no existing entry for any poll route, so there's no overlap risk.
- The rule is route-based, not poll-type-aware, so it will clear sessions cache on every poll close in a game (not only date polls) — consistent with the existing coarse-grained clearing used for other resource families (e.g. treasures clearing on npc treasure acquire/sell).
- Session-related JSON routes (from `backend/games/urls/games.py`): `sessions.json`, `sessions/<id>.json`, `sessions/past.json`, `sessions/future.json`, `sessions/unscheduled.json`.

## Implementation Steps

### Step 1 — Add `sessions.php` cache-cleanup group file
Create `proxy/extension/lib/configuration/cache_cleanup/sessions.php`, following the same shape as `treasures.php`/`npcs.php`/`pcs.php` (a file returning a list of `{'targets' => [...], 'routes' => [...]}` groups):

```php
<?php
/**
 * Cache-cleanup groups for the sessions resource family, consumed by
 * cache_cleanup_map.php to build $cacheCleanupMap.
 *
 * @return array List of sessions-family cache-cleanup groups.
 */

return [
    // Closing a poll may update a linked GameSession's date
    // (see GameSessionCloseProcessor), so it must clear all cached session
    // list/detail responses for the game.
    [
        'targets' => [
            '/games/:game_slug/sessions.json',
            '/games/:game_slug/sessions/:session_id.json',
            '/games/:game_slug/sessions/past.json',
            '/games/:game_slug/sessions/future.json',
            '/games/:game_slug/sessions/unscheduled.json',
        ],
        'routes' => [
            '/games/:game_slug/polls/:poll_id/close.json',
        ],
    ],
];
```

Confirm the exact placeholder names/casing used elsewhere (`:game_slug`, `:treasure_id`, etc.) match this project's route-placeholder convention before finalizing — mirror whatever `npcs.php`/`treasures.php` use for their own `:id`-style placeholders.

### Step 2 — Wire the new group into `cache_cleanup_map.php`
Update `proxy/extension/lib/configuration/cache_cleanup/cache_cleanup_map.php` to `require` the new file and merge it into `$cacheCleanupGroups`, the same way `npcs.php`/`pcs.php`/`treasures.php` are merged today.

### Step 3 — Verify no route collisions
`CacheCleanupMapBuilder::build()` lets a later group overwrite an earlier one for the same route. Double check the poll `close.json` route isn't already used as a trigger route in any other group (confirmed clear during planning — re-check if other cache-cleanup files changed since).

### Step 4 — Tests
- Add/extend a PHPUnit test (alongside `proxy/extension/tests/middlewares/CacheCleanupMapBuilderTest.php`, or a new test targeting the merged `$cacheCleanupMap` from `cache_cleanup_map.php`) asserting that `/games/:game_slug/polls/:poll_id/close.json` maps to the five session targets listed above.
- Lint the new/changed PHP files.

## Files to Change
- `proxy/extension/lib/configuration/cache_cleanup/sessions.php` — new file, defines the poll-close → sessions cache-cleanup group.
- `proxy/extension/lib/configuration/cache_cleanup/cache_cleanup_map.php` — require and merge the new group file.
- `proxy/extension/tests/middlewares/CacheCleanupMapBuilderTest.php` (or a new test file) — cover the new mapping.

## CI Checks
- `proxy`: `docker run --rm -v "$PWD":/repo darthjee/tent:0.7.8 sh -c 'find /repo/proxy -name "*.php" -not -path "*/vendor/*" -print0 | xargs -0 -n1 php -l'` then `docker-compose run --rm --workdir /var/www/html/extension proxy_tests vendor/bin/phpunit tests` (see `.claude/scripts/check_proxy.sh`; no dedicated CircleCI job runs this today — `upload_extension` only packages `proxy/extension/` for release).

## Notes
- No backend, frontend, or infra changes are needed — this is a proxy-only configuration change.
- The `.claude/agents/proxy.md` doc still references an older `proxy/custom/extend` / `proxy/custom/tests` layout; the actual directory on disk is `proxy/extension/` — use the real path, not the doc's.
