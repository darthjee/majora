# Proxy Plan: Add per-row kick control to faction character list

Main plan: [plan.md](plan.md)

## Shared contracts

- The trigger routes already exist and are unchanged: `/games/:game_slug/pcs/:id/factions/remove.json`, `/games/:game_slug/pcs/:id/factions/remove/all.json`, `/games/:game_slug/npcs/:id/factions/remove.json`, `/games/:game_slug/npcs/:id/factions/remove/all.json`.
- This plan only adds cache-cleanup **targets** to those existing trigger routes — no proxy routing changes, no new middleware.
- Out of scope: purging `/games/:game_slug/factions/:faction_id/characters.json` — the trigger routes don't carry `:faction_id` in the URL (it's a POST body param, `game_faction_id`), so it can't be captured for target-path substitution by this mechanism. Tracked separately in #1119; do not attempt a workaround here (e.g. do not add a `:faction_id` URL param to the trigger routes as a side effect of this issue — that's backend-endpoint scope, explicitly deferred to #1119's own decision).

## Implementation Steps

### Step 1 — Add remove/remove-all as trigger routes in `pcs.php`

File: `proxy/extension/lib/configuration/cache_cleanup/pcs.php`.

Add `/games/:game_slug/pcs/:character_id/factions/remove.json` and `/games/:game_slug/pcs/:character_id/factions/remove/all.json` to the existing `routes` array in the "pcs entity family" group (lines 26-35), alongside the existing `photo_upload.json` trigger — reuse `$pcsEntityTargets` (already includes `/games/:game_slug/pcs/:character_id/factions.json`? verify — if not present, add it to `$pcsEntityTargets`, lines 19-24, since that's the endpoint the character's own faction list is served from and it needs to be purged on kick).

Note the placeholder name: this file's existing convention uses `:character_id` (not `:id`, which is what the endpoint's own URL definition in `factionConfig.js` calls it on the frontend side) — match this file's existing `:character_id` naming for consistency with its other entries.

### Step 2 — Add the NPC equivalent in `npcs.php`

File: `proxy/extension/lib/configuration/cache_cleanup/npcs.php`.

Same as Step 1, but in the "npcs entity family" group (lines 38-47): add `/games/:game_slug/npcs/:character_id/factions/remove.json` and `/games/:game_slug/npcs/:character_id/factions/remove/all.json` to `routes`, and ensure `/games/:game_slug/npcs/:character_id/factions.json` is present in `$npcsEntityTargets` (lines 19-25) — add it if missing.

### Step 3 — Verify via existing tests / add new ones

- Confirm `phpunit` test coverage for `cache_cleanup_map.php`/`CacheCleanupMiddleware` already exercises this map-building logic generically (look for existing tests covering `factions.php`'s `photo_upload.json` entry as a model) — add a new test case for the new pcs/npcs remove routes if the existing tests are per-entry rather than purely structural, following whatever pattern is already used for the `photo_upload.json` case.

## Files to Change

- `proxy/extension/lib/configuration/cache_cleanup/pcs.php` — add remove/remove-all trigger routes; add `factions.json` to `$pcsEntityTargets` if not already present.
- `proxy/extension/lib/configuration/cache_cleanup/npcs.php` — add remove/remove-all trigger routes; add `factions.json` to `$npcsEntityTargets` if not already present.
- `proxy/extension/tests/...` — new/updated test case(s) covering the new cache-cleanup entries (exact path depends on how existing `cache_cleanup` tests are organized; mirror the closest existing precedent, e.g. whatever covers the `photo_upload.json` entry).

## CI Checks

- `proxy`: `vendor/bin/phpunit --bootstrap /var/www/html/extension/tests/bootstrap.php /var/www/html/extension/tests` (CI job: `proxy_extension_tests`).

## Notes

- Do not touch `proxy/extension/lib/configuration/cache_cleanup/factions.php` — the faction-side purge (`/games/:game_slug/factions/:faction_id/characters.json`) is explicitly out of scope here and tracked in #1119.
- No backend or frontend changes are required for this half of the work — it's purely proxy config plus its own test coverage.
