# Issue: npc filters is not respecting view as

## Description
On the NPC list page (`/#/games/:game_slug/npcs`), a DM using "View as" to simulate a player role still has NPC filter requests hit `/games/:game_slug/npcs/all.json?<filter_query>`, the DM-only endpoint, instead of the player-scoped `/games/:game_slug/npcs.json?<filter_query>`.

## Problem
`GameNpcsController#fetchNpcs` (`frontend/assets/js/components/resources/character/pages/controllers/GameNpcsController.js`) chooses the NPC endpoint based on whether `AuthStorage.getToken()` returns a raw auth token, and prefers the `all.json` result whenever that fetch succeeds — regardless of the simulated role set via "View as" (`AccessStoreFacade`). Since a DM always has a real token, `all.json` (and its filter query) is always used, even while impersonating a player. This is unrelated to whether a filter is applied — the same endpoint-selection logic runs on both the initial unfiltered load and every filtered re-fetch (`handleFilterQuery` re-triggers the same `#fetchNpcs`).

Note: the identical bug pattern also exists in `GameController#fetchNpcsPreview` (the NPC preview widget on the game page), but that is out of scope for this issue and should be tracked separately.

## Expected Behavior
When a DM is using "View as" to simulate a player, all NPC list requests — filtered or not — should go to `/games/:game_slug/npcs.json`, matching what an actual player would see. Endpoint selection should be based on the effective (possibly simulated) role, not on raw token presence.

## Solution
Align `GameNpcsController` with the pattern already used by `GameTreasuresController#loadTreasures`/`#fetchTreasures` (`frontend/assets/js/components/resources/treasure/pages/controllers/GameTreasuresController.js`): resolve the effective, facade-aware access/permissions first (`AccessStore.ensureGameAccess`/`ensureGamePermissions`, already called in `#fetchAccess` for UI gating but not reused for endpoint choice), then fetch a single endpoint (`npcs/all.json` vs `npcs.json`) based on that resolved role, applying pagination/filter params to that one request. Drop the current dual-fetch/race against both endpoints (`Promise.allSettled` over `publicFetch`/`allFetch` and the `all.json`-preferring fallback logic in `#applyNpcsResult`/`#tryGetAuthNpcs`) in favor of this single-fetch approach, matching Treasures exactly.

## Benefits
NPC data (including filtered results) correctly respects "View as" simulation, matching the behavior already correct for treasures, so DMs can reliably preview the player experience. The single-fetch approach also removes an unnecessary duplicate request per page load/filter change.
