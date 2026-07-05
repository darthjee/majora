# Proxy Plan: Add NPC slain

Main plan: [plan.md](plan.md)

## Shared contracts

The `backend` agent adds a new write endpoint,
`PATCH /games/<slug>/npcs/<character_id>/slain.json`, that changes data also
readable through `/games/<slug>/npcs.json`, `/games/<slug>/npcs/all.json`,
`/games/<slug>/npcs/<character_id>.json`, and
`/games/<slug>/npcs/<character_id>/full.json` (all cached, `GET`, via Tent's
`default_proxy`). Without an explicit cache-cleanup mapping, a write to the
new route would not immediately invalidate those cached `GET` responses (the
default `collection`/`entity` clearing only targets cache keys derived from
the write request's own URL, not sibling routes) — so a freshly-toggled
`slain` value could keep showing stale (non-grayscale or grayscale)
photos for anyone hitting the cache, until the existing 10s
`CacheStalenessMiddleware` window naturally expires.

## Implementation Steps

### Step 1 — Add the new route to both cache-cleanup configs

This is exactly the same kind of gap issue #324 fixed for the NPC/PC detail
PATCH routes. Add one more `custom` entry, in both
`proxy/dev_configuration/rules/backend.php` and
`proxy/prod_configuration/rules/backend.php`, reusing the identical target
list already used for `/games/:game_slug/npcs/:character_id.json`:

```php
'/games/:game_slug/npcs/:character_id/slain.json' => [
    '/games/:game_slug/npcs.json',
    '/games/:game_slug/npcs/all.json',
    '/games/:game_slug/npcs/:character_id.json',
    '/games/:game_slug/npcs/:character_id/full.json',
],
```

Add it inside the same `'custom' => [...]` array already present in both
files (see the entries added by issue #324), immediately after the
`/games/:game_slug/npcs/:character_id.json` entry, keeping the array in the
same declarative style (trailing commas, alignment) as the existing three
entries.

### Step 2 — Verify no test changes are needed

Issue #324 (the precedent for this exact kind of change) modified only
these two declarative PHP array config files, with no accompanying test
changes — the `custom` cleanup map is data consumed by
`Tent\Middlewares\CacheCleanupMiddleware`, not new logic. Confirm this is
still the case (check `proxy/extension/tests/` for anything that enumerates
or asserts on the full `custom` map) before concluding no test changes are
required; if such a test exists, extend it with the new route the same way
the existing three entries are covered.

## Files to Change

- `proxy/dev_configuration/rules/backend.php` — add the new cache-cleanup entry
- `proxy/prod_configuration/rules/backend.php` — add the new cache-cleanup entry (must stay in sync with dev)

## CI Checks

- Check `.circleci/config.yml` for whichever job runs `proxy/extension/tests/`
  (PHPUnit) and run it locally via `docker-compose run` if the Step 2
  investigation finds relevant tests to extend; otherwise this is a
  config-only change with no dedicated CI test target.

## Notes

- Keep `dev_configuration` and `prod_configuration` byte-for-byte identical
  for this `custom` map, exactly as issue #324 left them — this has been the
  convention for every existing entry.
- `security` review should be invoked (alongside the `backend` changes)
  since this touches Tent proxy cache rules for a new endpoint.
