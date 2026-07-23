# Proxy Plan: Allow acquire of treasures without paying the price

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the new backend route paths documented in [plan.md](plan.md)'s "Shared contracts"
section (`.../treasures/acquire.json`, `.../treasures/acquire/all.json`,
`.../treasures/remove.json`, both PC and NPC). No output produced for other agents — this is
a leaf, cache-invalidation-only change.

## Implementation Steps

### Step 1 — Add PC acquire/remove routes to the cache-cleanup trigger list

In `proxy/extension/lib/configuration/cache_cleanup/pcs.php`, the "pcs treasures buy/sell"
group (lines 31-41) lists `buy.json`/`sell.json` as trigger routes against the PC entity +
treasures-list targets. Add the three new routes to that same `routes` array:

```php
'routes' => [
    '/games/:game_slug/pcs/:character_id/treasures/buy.json',
    '/games/:game_slug/pcs/:character_id/treasures/sell.json',
    '/games/:game_slug/pcs/:character_id/treasures/acquire.json',
    '/games/:game_slug/pcs/:character_id/treasures/acquire/all.json',
    '/games/:game_slug/pcs/:character_id/treasures/remove.json',
],
```

(Optionally rename the group's comment from "pcs treasures buy/sell" to "pcs treasures
buy/sell/acquire/remove" for accuracy — judgment call.)

### Step 2 — Add NPC acquire/remove routes to the cache-cleanup trigger list

Same change in `proxy/extension/lib/configuration/cache_cleanup/npcs.php`'s equivalent "npcs
treasures buy/sell" group (lines ~43-51).

### Step 3 — Update the treasures-family group

`proxy/extension/lib/configuration/cache_cleanup/treasures.php`'s third group (lines 36-49)
currently lists only the **NPC** `buy.json`/`sell.json` routes (not PC's — this asymmetry is
pre-existing, mirror it as-is rather than "fixing" it). Add the NPC acquire/remove routes
there too:

```php
'routes' => [
    '/treasures.json',
    '/treasures/:treasure_id.json',
    '/games/:game_slug/treasures/:treasure_id.json',
    '/games/:game_slug/npcs/:character_id/treasures/buy.json',
    '/games/:game_slug/npcs/:character_id/treasures/sell.json',
    '/games/:game_slug/npcs/:character_id/treasures/acquire.json',
    '/games/:game_slug/npcs/:character_id/treasures/acquire/all.json',
    '/games/:game_slug/npcs/:character_id/treasures/remove.json',
],
```

### Step 4 — Proxy tests

Check `proxy/custom/tests/` (or wherever the cache-cleanup map has PHPUnit coverage) for an
existing buy/sell trigger-route test and extend it with the new routes, if such a test
exists; otherwise no new test scaffolding is required (these config files may only be
exercised indirectly).

## Files to Change

- `proxy/extension/lib/configuration/cache_cleanup/pcs.php` — add 3 routes to the treasures group
- `proxy/extension/lib/configuration/cache_cleanup/npcs.php` — add 3 routes to the treasures group
- `proxy/extension/lib/configuration/cache_cleanup/treasures.php` — add 3 NPC routes to the third group

## Notes

- This is config-only (PHP arrays), no proxy middleware logic changes.
- Wait for the `backend` agent's routes (Step 5 of [backend.md](backend.md)) to land first —
  these route strings must match exactly.
