# Proxy Plan: Faction Character List Cache Not Purged When A Character Is Kicked From A Faction

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the new endpoint shape (see [plan.md](plan.md#shared-contracts)) — once `faction_id` is a
real path segment on these trigger routes, it becomes capturable via `PlaceholderPattern::match()`
and can be substituted into a `:faction_id` target placeholder:

- `POST /games/:game_slug/{pcs,npcs}/:character_id/factions/:faction_id/remove.json`
- `POST /games/:game_slug/{pcs,npcs}/:character_id/factions/:faction_id/remove/all.json`

## Implementation Steps

### Step 1 — Update the `pcs.php` trigger routes and add the new target

In `proxy/extension/lib/configuration/cache_cleanup/pcs.php`:

- Update the existing trigger routes in the "pcs entity family" group from
  `/games/:game_slug/pcs/:character_id/factions/remove.json` /
  `/games/:game_slug/pcs/:character_id/factions/remove/all.json` to
  `/games/:game_slug/pcs/:character_id/factions/:faction_id/remove.json` /
  `/games/:game_slug/pcs/:character_id/factions/:faction_id/remove/all.json`.
- Add `/games/:game_slug/factions/:faction_id/characters.json` to that group's `targets` list
  (`$pcsEntityTargets`), mirroring the existing pattern at `factions.php:16-23`.

### Step 2 — Update the `npcs.php` trigger routes and add the new target

Same change in `proxy/extension/lib/configuration/cache_cleanup/npcs.php`'s "npcs entity family"
group: update the two trigger routes to include `:faction_id`, and add
`/games/:game_slug/factions/:faction_id/characters.json` to `$npcsEntityTargets`.

### Step 3 — Add/update tests

Extend `proxy_extension_tests`' PHPUnit coverage for `pcs.php`/`npcs.php`'s cache-cleanup groups
(find the existing test file(s) covering these groups' trigger→target maps) to assert that hitting
`.../factions/:faction_id/remove.json` (and `/remove/all.json`) now purges
`/games/:game_slug/factions/:faction_id/characters.json`, in addition to the pre-existing targets.

## Files to Change

- `proxy/extension/lib/configuration/cache_cleanup/pcs.php` — trigger routes gain `:faction_id`; new target added.
- `proxy/extension/lib/configuration/cache_cleanup/npcs.php` — trigger routes gain `:faction_id`; new target added.
- Corresponding PHPUnit test file(s) under `proxy/extension/tests/` covering these two cache-cleanup groups.

## CI Checks

- `proxy`: `vendor/bin/phpunit --bootstrap extension/tests/bootstrap.php extension/tests` (CI job: `proxy_extension_tests`)

## Notes

- Depends on backend landing the `:faction_id` URL segment first (or in the same PR) — these
  trigger route strings must match the real route exactly for `PlaceholderPattern::match()` to
  fire.
