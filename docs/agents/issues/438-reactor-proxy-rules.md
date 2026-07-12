# Issue: Reactor proxy rules

## Description

`proxy/prod_configuration/rules/backend.php` and `proxy/dev_configuration/rules/backend.php` (used in production and development, respectively) configure `Tent\Middlewares\CacheCleanupMiddleware` (see `docs/agents/HOW_TO_USE_DARTHJEE-TENT.md#cachecleanupmiddleware`) directly inline. This middleware clears cache when mutating requests (`POST`, `PATCH`, `DELETE`) are handled.

Its `custom` option maps a triggering route to the list of cache paths that must be cleared when that route is hit, e.g.:

```php
'custom'   => [
    '/games/:game_slug/npcs.json' => [
        '/games/:game_slug/npcs.json',
        '/games/:game_slug/npcs/all.json',
    ],
    ...
],
```

This means `POST`/`PATCH`/`DELETE` requests to `/games/:game_slug/npcs.json` clear, in addition to the regular cache, `/games/:game_slug/npcs.json` and `/games/:game_slug/npcs/all.json`.

## Problem

### `backend.php` is too big

The `custom` mapping is defined inline inside `backend.php`, making the file large and mixing routing/handler setup with cache-invalidation data.

### There is too much repetition

Many distinct trigger routes clear the exact same set of cache paths. For example, in the current `prod_configuration` mapping, these three different routes all clear the identical four-path target list:

```php
'/games/:game_slug/npcs/:character_id.json' => [
    '/games/:game_slug/npcs.json',
    '/games/:game_slug/npcs/all.json',
    '/games/:game_slug/npcs/:character_id.json',
    '/games/:game_slug/npcs/:character_id/full.json',
],
'/games/:game_slug/npcs/:character_id/photo_upload.json' => [
    '/games/:game_slug/npcs.json',
    '/games/:game_slug/npcs/all.json',
    '/games/:game_slug/npcs/:character_id.json',
    '/games/:game_slug/npcs/:character_id/full.json',
],
'/games/:game_slug/npcs/:character_id/slain.json' => [
    '/games/:game_slug/npcs.json',
    '/games/:game_slug/npcs/all.json',
    '/games/:game_slug/npcs/:character_id.json',
    '/games/:game_slug/npcs/:character_id/full.json',
],
```

The same pattern repeats for the `pcs` and `treasures` families of routes, and the treasures `acquire`/`sell` routes clear that same base list plus one extra target.

## Solution

- Extract the `custom` mapping out of `backend.php` into a dedicated file under `rules/` (inside both `proxy/prod_configuration` and `proxy/dev_configuration`), which defines a variable consumed by `backend.php`'s `'custom' => $variable`.
- Deduplicate by defining reusable groups of cache-target paths (e.g. one group per resource family — `npcs`, `pcs`, `treasures`), each with its own list of trigger routes that should clear that same target list. Routes needing extra targets on top of a group's base list (e.g. the treasures `acquire`/`sell` routes) get their own group extending the base list, rather than repeating it wholesale.
- Add a class `CacheCleanupMapBuilder` under `proxy/extension/lib` that transforms the group definitions into the flat per-route map `CacheCleanupMiddleware`'s `custom` option expects (route => list of targets), with its own PHPUnit test under `proxy/extension/tests`, mirroring how other `proxy/extension/lib` classes are tested.
- The new `rules/*.php` file in each configuration defines the groups and calls `CacheCleanupMapBuilder::build($groups)` to produce the variable used by `backend.php`.

## Important

`proxy/prod_configuration` and `proxy/dev_configuration` are independent (used in production and development respectively), so duplication of the new rules file between the two is expected and acceptable.

## Benefits

- `backend.php` shrinks back to routing/handler concerns only.
- Cache-target lists shared by several routes live in one place, so updating a resource family's cache targets only requires editing one group instead of every route that references it.
- Less chance of a copy-paste mistake (e.g. a route's target list drifting from its siblings) when adding new mutating routes in the future.
