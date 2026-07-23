# Proxy Plan: Refactor treasure exchange modal

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes backend's endpoint rename (see [plan.md](plan.md)/[backend.md](backend.md)): `.../treasures/acquire.json` becomes `.../treasures/buy.json`.

## Implementation Steps

### Step 1 — Rename the cache-cleanup trigger route

In `proxy/extension/lib/configuration/cache_cleanup/treasures.php`, the third group's `routes` array currently has:

```php
'/games/:game_slug/npcs/:character_id/treasures/acquire.json',
```

Replace with:

```php
'/games/:game_slug/npcs/:character_id/treasures/buy.json',
```

A literal string swap — no logic change, no new targets. Note this group's `routes` only ever listed the NPC acquire/sell paths (not PC's); that's a pre-existing asymmetry, out of scope for this issue — don't add PC routes here as part of this change.

## Files to Change

- `proxy/extension/lib/configuration/cache_cleanup/treasures.php` — rename the `acquire.json` route to `buy.json`.

## Notes

- No CI job runs the PHPUnit proxy tests today (per `docker-compose.yml`'s `proxy_tests` service and `.claude/scripts/check_proxy.sh`); run `docker-compose run --rm --workdir /var/www/html/extension proxy_tests vendor/bin/phpunit tests` locally to confirm nothing else in `proxy/extension/tests/` references the old `acquire.json` path.
