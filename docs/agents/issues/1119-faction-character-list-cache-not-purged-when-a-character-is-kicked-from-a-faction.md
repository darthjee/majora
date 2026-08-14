# Faction character-list cache not purged when a character is kicked from a faction

## Context

While enhancing #1106 (adding a per-row "kick" control to the faction character-list panel), a gap was found in the proxy's cache-invalidation mechanism (`proxy/extension/lib/configuration/cache_cleanup/`).

The kick action reuses the existing per-character remove endpoints — `/games/:game_slug/pcs/:id/factions/remove.json`, `/games/:game_slug/pcs/:id/factions/remove/all.json`, and the NPC equivalents under `/games/:game_slug/npcs/:id/...`. These are POST "trigger" routes; the mechanism purges GET-endpoint caches by capturing named placeholders from the trigger route's URL and substituting them into GET "target" route templates (confirmed precedent: `proxy/extension/lib/configuration/cache_cleanup/factions.php:20-23`, where the trigger `/games/:game_slug/factions/:faction_id/photo_upload.json` purges targets `/games/:game_slug/factions.json` and `/games/:game_slug/factions/:faction_id.json`).

The faction's own character-list cache, `/games/:game_slug/factions/:faction_id/characters.json`, needs `:faction_id` to resolve — but the remove/remove-all trigger URLs only carry `:game_slug` and the character's own `:id`. The faction being removed from is identified in the POST body (`game_faction_id`), not the URL (confirmed in `backend/games/tests/views/game/pcs/detail/factions/game_pc_faction_remove_test.py:64` and `:140`), so `:faction_id` cannot be captured from the trigger route today.

This was investigated further and confirmed against the underlying cache-cleanup engine (in the separate `darthjee/tent` package — `CacheCleanupMiddleware.php` and `PlaceholderPattern.php`):

- `cleanCustomTargets()` matches the trigger route against `PlaceholderPattern::match()` to capture named values, then calls `PlaceholderPattern::substitute()` for each target template.
- `substitute()` does token-by-token replacement (`$values[$name] ?? $matches[0]`): if a target placeholder isn't present among the captured trigger values, it is **silently left as the literal `:name` string** in the resulting path — not an error, and not a prefix/wildcard match.
- `cleanPath()` then resolves that fully-substituted string to one **exact concrete directory** to delete — there is no glob/prefix-level purge capability in the engine as it stands.

This rules out candidate option (b) from the original triage (a broader directory/wildcard purge) — **it is not supported today** and would require an engine-level change in the `darthjee/tent` package, outside this repo. It leaves options (a) and (c) as the realistic paths forward.

For #1106 itself, this gap was scoped around: the two per-character targets (`/games/:game_slug/pcs/:character_id/factions.json` and `/games/:game_slug/npcs/:character_id/factions.json`) purge fine since they only need the trigger's own `:id`, and were added to `pcs.php`/`npcs.php` (both files exist today but, as of this writing, have no faction-remove routes wired in). The faction's own `characters.json` target is left stale-until-TTL after a kick — the same as it is for every other mutation on that panel today — and was out of scope for #1106.

## What needs to be done

Decide on and implement a proper cache-purge path for `/games/:game_slug/factions/:faction_id/characters.json` when a character is removed from a faction via the remove/remove-all endpoints. Candidate approaches to evaluate:

- **(a) Carry `faction_id` in the trigger URL.** Add `faction_id` as a URL path (or query) param on the remove/remove-all endpoints specifically so the proxy can capture it via `PlaceholderPattern::match()` — e.g. `/games/:game_slug/pcs/:id/factions/:faction_id/remove.json`. Requires:
  - Backend: new/adjusted URL route(s) and view(s) accepting `faction_id` from the path instead of (or in addition to) the POST body, plus updated tests.
  - Frontend: update the faction-panel kick action to call the new URL shape.
  - Proxy: add the corresponding trigger → target group to `pcs.php` / `npcs.php` (or `factions.php`, mirroring the existing pattern at `factions.php:20-23`) purging `/games/:game_slug/factions/:faction_id/characters.json`.
- **(b) Broader wildcard/prefix purge in the cache-cleanup engine.** Confirmed **not currently supported** by `CacheCleanupMiddleware`/`PlaceholderPattern`/`CacheDirCleaner` in the `darthjee/tent` package. Would require an upstream engine change (outside this repo) to support purging by path prefix or unresolved-placeholder directories. Note this as a longer-term/cross-repo option only if (a) and (c) are both rejected.
- **(c) Other invalidation approach.** E.g. purge the faction's `characters.json` cache from within the Django view itself (an explicit, out-of-band cache-clear call at the point of mutation) rather than through the URL-substitution mechanism, if such a hook exists or can be added to the proxy/backend boundary. Needs investigation into whether the backend has (or should gain) any mechanism to trigger a Tent cache purge directly.

Whichever option is chosen:

- Backend: implement any required route/view/serializer changes and tests.
- Proxy: wire the new trigger → target purge rule(s) in `proxy/extension/lib/configuration/cache_cleanup/`.
- Frontend: adjust the kick action's request if the endpoint shape changes.
- Cache: re-verify the Navi warm-up config/docs (`docs/agents/cache-warmer.md`, `navi/navi_config.yaml`) are unaffected or updated if endpoint shapes change.
- Docs: update `docs/agents/access-control/character-faction.md` and any proxy cache-cleanup documentation to reflect the final approach.

## Acceptance criteria

- [ ] A decision is made and documented on which invalidation approach ((a), (b), or (c)) is used to purge `/games/:game_slug/factions/:faction_id/characters.json` on character removal from a faction.
- [ ] After a character is removed from a faction (single remove or remove-all) via the PC or NPC endpoints, a subsequent `GET /games/:game_slug/factions/:faction_id/characters.json` reflects the change without waiting for TTL expiry.
- [ ] The chosen approach is covered by backend and/or proxy tests demonstrating the cache is purged correctly.
- [ ] `docs/agents/access-control/character-faction.md` (and any other affected docs under `docs/agents/`) is updated to reflect the final endpoint shape and invalidation behavior.
