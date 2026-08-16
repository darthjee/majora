# Issue: Faction Character List Cache Not Purged When A Character Is Kicked From A Faction

## Description

Kicking a character (PC or NPC) out of a faction — via the remove/remove-all endpoints reused by both the faction page's "kick" action and the character page's self-service "Quit faction" tab — does not purge the faction's own character-list cache, `/games/:game_slug/factions/:faction_id/characters.json`. The list stays stale until TTL expiry instead of reflecting the removal immediately.

## Problem

While enhancing #1106 (adding a per-row "kick" control to the faction character-list panel), a gap was found in the proxy's cache-invalidation mechanism (`proxy/extension/lib/configuration/cache_cleanup/`).

The kick action reuses the existing per-character remove endpoints — `/games/:game_slug/pcs/:id/factions/remove.json`, `/games/:game_slug/pcs/:id/factions/remove/all.json`, and the NPC equivalents under `/games/:game_slug/npcs/:id/...`. These are POST "trigger" routes; the mechanism purges GET-endpoint caches by capturing named placeholders from the trigger route's URL and substituting them into GET "target" route templates (confirmed precedent: `proxy/extension/lib/configuration/cache_cleanup/factions.php:16-23`, where the trigger `/games/:game_slug/factions/:faction_id/photo_upload.json` purges targets `/games/:game_slug/factions.json` and `/games/:game_slug/factions/:faction_id.json`).

The faction's own character-list cache, `/games/:game_slug/factions/:faction_id/characters.json`, needs `:faction_id` to resolve — but the remove/remove-all trigger URLs only carry `:game_slug` and the character's own `:id`. The faction being removed from is identified in the POST body (`game_faction_id`), not the URL (confirmed in `backend/games/tests/views/game/pcs/detail/factions/game_pc_faction_remove_test.py:64` and `:132-144`; serializer at `backend/games/views/game/_faction_exchange.py:31-34`), so `:faction_id` cannot be captured from the trigger route today.

This was investigated further and confirmed against the underlying cache-cleanup engine (in the separate `darthjee/tent` package — `CacheCleanupMiddleware.php` and `PlaceholderPattern.php`, also documented at `docs/agents/external/tent/middlewares.md:83-88`):

- `cleanCustomTargets()` matches the trigger route against `PlaceholderPattern::match()` to capture named values, then calls `PlaceholderPattern::substitute()` for each target template. Matching/substitution only ever operates on URL path placeholders — never body fields — by design.
- `substitute()` does token-by-token replacement (`$values[$name] ?? $matches[0]`): if a target placeholder isn't present among the captured trigger values, it is **silently left as the literal `:name` string** in the resulting path — not an error, and not a prefix/wildcard match.
- `cleanPath()` then resolves that fully-substituted string to one **exact concrete directory** to delete — there is no glob/prefix-level purge capability in the engine as it stands. This rules out a broader directory/wildcard purge as a candidate; it would require an engine-level change in the `darthjee/tent` package, outside this repo.

For #1106 itself, this gap was scoped around: the two per-character targets (`/games/:game_slug/pcs/:character_id/factions.json` and `/games/:game_slug/npcs/:character_id/factions.json`) purge fine since they only need the trigger's own `:id`. `pcs.php:31-37` and `npcs.php:39-50` already wire the `factions/remove.json`/`factions/remove/all.json` trigger routes today — the gap isn't a missing route, it's that their existing target lists can't include the faction's own `characters.json`, because `:faction_id` isn't capturable from the trigger URL. The faction's own `characters.json` target is left stale-until-TTL after a kick — the same as it is for every other mutation on that panel today — and was out of scope for #1106.

The same four backend endpoints (PC/NPC × remove/remove-all) are shared by two frontend callers, both routing through the same `factionConfig.js` `remove`/`removeAll` path builders: `FactionCharactersPanelController.kick()` (the faction page's kick action) and `RemoveFactionTabController.remove()` (the character page's self-service "Quit faction" tab).

Investigation also confirmed there is no existing backend→proxy mechanism for a targeted cache purge outside the URL-substitution scheme above: the only backend "cache clear" endpoint (`backend/staff/views/staff_cache_clear.py`) clears an unrelated in-app memory cache, and the only proxy-side purge handler (`CacheClearHandler.php`, `DELETE /staff/cache/disk.json`) wipes the entire cache with no path targeting.

## Expected Behavior

- [ ] The remove/remove-all endpoints (PC and NPC) carry `faction_id` as a URL path segment, and both the kick action and the "Quit faction" self-service tab call the updated URL shape.
- [ ] After a character is removed from a faction (single remove or remove-all) via either caller, a subsequent `GET /games/:game_slug/factions/:faction_id/characters.json` reflects the change without waiting for TTL expiry.
- [ ] The purge is covered by backend and/or proxy tests demonstrating the cache is purged correctly.
- [ ] `docs/agents/access-control/character-faction.md` (and any other affected docs under `docs/agents/`) is updated to reflect the final endpoint shape and invalidation behavior.

## Solution

Carry `faction_id` as a URL path segment on the remove/remove-all endpoints so the proxy can capture it via `PlaceholderPattern::match()` and purge the faction's `characters.json` cache — e.g. `/games/:game_slug/pcs/:id/factions/:faction_id/remove.json`. Chosen over building a new backend→proxy purge hook: that alternative would require new infrastructure from scratch (a new proxy endpoint plus a Django→proxy HTTP call), a materially larger scope with no existing precedent, versus this option's routine URL/view change following an already-proven proxy pattern. A broader wildcard/prefix purge in the cache-cleanup engine itself was also considered and ruled out — not supported by the underlying `darthjee/tent` package today.

- **Backend**: adjust the URL route(s) and view(s) for all four route pairs (PC/NPC × remove/remove-all) to accept `faction_id` from the path instead of (or in addition to) the POST body, plus updated tests.
- **Frontend**: update both callers that share the `factionConfig.js` `remove`/`removeAll` path builders — `FactionCharactersPanelController.kick()` (faction page kick action) and `RemoveFactionTabController.remove()` (character page's self-service "Quit faction" tab) — to call the new URL shape.
- **Proxy**: extend the trigger → target groups already wired in `pcs.php` (`:31-37`) and `npcs.php` (`:39-50`) to also purge `/games/:game_slug/factions/:faction_id/characters.json`, mirroring the structural pattern at `factions.php:16-23`.
- **Cache**: re-verify the Navi warm-up config/docs (`docs/agents/cache-warmer.md`, `navi/navi_config.yaml`) are unaffected or updated for the new endpoint shape.
- **Docs**: update `docs/agents/access-control/character-faction.md` and any proxy cache-cleanup documentation to reflect the final endpoint shape and invalidation behavior.
