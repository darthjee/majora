# Issue: Polls should not have cache but should clear session cache

## Description
Closing a poll linked to a game session (a "date poll") updates that session's `date` field, but the proxy's cached session responses are not invalidated, so clients keep seeing the stale date.

## Problem
- `GameSessionCloseProcessor` overwrites a linked `GameSession`'s `date` field when its poll is closed via `PATCH /games/:game_slug/polls/:id/close.json`.
- The proxy has no cache-cleanup rule wired for this route, so its cached session list/detail responses keep serving the pre-close date.
- (The poll endpoints themselves already skip proxy caching via `X-Skip-Cache`, set in earlier issues #536/#548/#557/#571 — no work needed there.)

## Expected Behavior
Closing a poll (`PATCH /games/:game_slug/polls/:id/close.json`) must clear the proxy's cached session data for the game, covering every session list/detail variant.

## Solution
Add a cache-cleanup group in `proxy/extension/lib/configuration/cache_cleanup` (new `sessions.php`, wired into `cache_cleanup_map.php` the same way `npcs.php`/`pcs.php`/`treasures.php` are), pairing:

- Routes: `/games/:game_slug/polls/:id/close.json`
- Targets:
  - `/games/:game_slug/sessions.json`
  - `/games/:game_slug/sessions/:id.json`
  - `/games/:game_slug/sessions/past.json`
  - `/games/:game_slug/sessions/future.json`
  - `/games/:game_slug/sessions/unscheduled.json`

This clears sessions cache on every poll close (not only date polls) since the proxy rule is route-based and cannot distinguish poll type — consistent with the coarse-grained clearing already used for other resource families (e.g. treasures).

## Benefits
Session list/detail pages reflect a poll-driven date change immediately instead of showing a stale cached date until the proxy's cache naturally expires.
