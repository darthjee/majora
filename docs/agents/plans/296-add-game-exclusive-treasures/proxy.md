# Proxy Plan: Add game-exclusive treasures

Main plan: [plan.md](plan.md)

## Shared contracts

`backend` adds a new write endpoint, `PATCH /games/<slug>/treasures/<int:treasure_id>.json`,
that changes data also readable through `GET /games/<slug>/treasures.json` and the (now
game-scoped-visible) global `GET /treasures/<id>.json`. It also adds `POST` support on the
existing `GET /games/<slug>/treasures.json` route. Without explicit cache-cleanup mappings for
the new route, a write could leave stale cached `GET` responses visible until the existing 10s
`CacheStalenessMiddleware` window naturally expires — this is exactly the same class of gap
issue #324 fixed for NPC/PC detail routes and issue #315 fixed for the NPC slain-toggle route.

## Implementation Steps

### Step 1 — Add cache-cleanup entries for the new/changed routes

In both `proxy/dev_configuration/rules/backend.php` and
`proxy/prod_configuration/rules/backend.php`, inside the existing `'custom' => [...]` array (see
the entries already present for `/games/:game_slug/npcs/...`), add:

```php
'/games/:game_slug/treasures.json' => [
    '/games/:game_slug/treasures.json',
    '/treasures.json',
],
'/games/:game_slug/treasures/:treasure_id.json' => [
    '/games/:game_slug/treasures.json',
    '/games/:game_slug/treasures/:treasure_id.json',
    '/treasures/:treasure_id.json',
    '/treasures/:treasure_id/access.json',
],
```

Rationale for each target:
- A `POST` to `/games/:game_slug/treasures.json` (creating a new game-exclusive treasure) should
  invalidate the global `/treasures.json` collection cache too, in case it was warmed/cached
  before this treasure existed — cheap, defensive, and consistent with how other `custom`
  entries err on the side of over-invalidating a handful of clearly-related routes.
- A `PATCH` to the new `/games/:game_slug/treasures/:treasure_id.json` route changes the same
  underlying `Treasure` row also served by the game-scoped list, the (now scoped) game-detail
  route for that id, the global single-treasure detail route (`/treasures/:treasure_id.json` —
  same id, same data, regardless of which endpoint updated it), and that treasure's access-check
  endpoint (whose `can_edit` value can change if the game's DM roster changes, though not from
  this specific write — included for consistency with how other entity detail writes already
  bust their sibling `/access.json` route; verify against an existing precedent before adding
  this last one, and drop it if no existing entry does the same for its own resource).

Confirm the exact placeholder name (`:treasure_id`) matches the URL parameter name backend uses
in `source/games/urls.py` for the new route (`<int:treasure_id>` per `backend.md` Step 5) — the
middleware substitutes placeholders from the write URL into the target URLs by name, so a
mismatch would silently fail to invalidate anything.

### Step 2 — Verify no test changes are needed

Per the issue #324/#315 precedent, this `custom` cleanup map is declarative data consumed by
`Tent\Middlewares\CacheCleanupMiddleware`, not new logic, and past additions needed no
accompanying test changes. Check `proxy/custom/tests/` for anything that enumerates or asserts
on the full `custom` map before concluding the same holds here; if such a test exists, extend it
with the two new entries the same way existing entries are covered.

## Files to Change

- `proxy/dev_configuration/rules/backend.php` — add the two new cache-cleanup entries
- `proxy/prod_configuration/rules/backend.php` — add the same two entries (must stay byte-for-byte in sync with dev)

## CI Checks

- Check `.circleci/config.yml` for whichever job runs `proxy/custom/tests/` (PHPUnit) and run it
  locally via `docker-compose run` if Step 2 finds relevant tests to extend; otherwise this is a
  config-only change with no dedicated CI test target.

## Notes

- Keep `dev_configuration` and `prod_configuration` identical for this `custom` map, exactly as
  every existing entry already does.
- `security` review should be invoked (alongside the `backend` changes) since this touches Tent
  proxy cache rules for new endpoints.
