# Issue: Unify index pages elements

## Description
Continues the index/list-page unification started in #443 (PR #665), which introduced the shared `ListPage`/`ListPageController`/`ListPageHelper` component stack and the `listTypeConfig.js` mapping object (already covering `treasures`, `items`, `pc-items`, `npc-items`), but intentionally left PCs, NPCs, the top-level games list, and character-scoped treasures on their previous bespoke implementations. This issue migrates the remaining list pages onto that shared pattern.

## Problem
- `/#/games` (`GamesHelper.jsx`/`GamesController.js`), `/#/games/:game_slug/pcs` and `/#/games/:game_slug/npcs` (sharing bespoke `GameCharactersHelper.jsx`), `/#/games/:game_slug/pcs/:id/treasures` and `/#/games/:game_slug/npcs/:id/treasures` (a fully separate stack: `CharacterTreasures.jsx`, `BaseCharacterTreasuresController`, `CharacterTreasuresHelper.jsx`), and `/#/treasures` (`TreasuresController.js`/`TreasuresHelper.jsx`) each still duplicate data-fetching, pagination, and per-item rendering instead of delegating to `listTypeConfig.js`.
- NPCs additionally carry extra bespoke logic (slain/revive toggles, filters, photo upload) layered directly onto the shared `GameCharactersHelper.jsx`, rather than gated per-item as the shared pattern expects.
- Character-scoped treasures carry an owner/quantity concept (`TreasureCardHelper.jsx`'s optional quantity badge hints at this) that the current game-level `treasures` list-type entry doesn't model.

## Expected Behavior
- `/#/games`, `/#/games/:game_slug/pcs`, `/#/games/:game_slug/npcs`, `/#/games/:game_slug/pcs/:id/treasures`, `/#/games/:game_slug/npcs/:id/treasures`, and `/#/treasures` all render through the shared `ListPage` component, each backed by its own `listTypeConfig` entry (`games`, `pcs`, `npcs`, `pc-treasures`, `npc-treasures`, and a global-scope treasures list — distinct from the existing game-scoped `treasures` entry).
- Same endpoints, same filters, same permissions, and identical visible behavior as today for every migrated page — this is a pure refactor, not a behavior change.
- `/#/games/:game_slug/treasures`, `/#/games/:game_slug/pcs/:id/items`, and `/#/games/:game_slug/npcs/:id/items` (already migrated in #443/#658) are unaffected.
- Out of scope: `/#/staff/users`, `/#/games/:game_slug/sessions`, `/#/games/:game_slug/polls`, and the PC/NPC `/photos` galleries stay on their current bespoke implementations — not part of this issue.

## Solution
- Add new `listTypeConfig` entries: `games`, `pcs`, `npcs`, `pc-treasures`, `npc-treasures`, and a global-scope treasures list entry (distinguished from the existing per-game `treasures` entry via a distinct key, since endpoint/permissions/filters differ: no `game_slug`, global `/treasures.json` endpoint, existing `TreasureFilters`-driven filters from #631).
- For `games`: since it has no `ActionsOverlay`/infobar/permission-gated alternate endpoint/filters today, its config entry supplies no-op values for those fields (`filtersComponent: null`, read-only action bar, no info bar items) rather than inventing new UI for it — matching how `items`/`pc-items`/`npc-items` already opt out of `filtersComponent`.
- For `pcs`/`npcs`: introduce `BaseListItem` subclasses wrapping character card data; move NPC-specific conditionally-shown items (slain/revive, photo upload) into their own gate-logic on the relevant info-bar/action-bar item component, instead of centralizing the checks in `GameCharactersHelper.jsx`.
- For `pc-treasures`/`npc-treasures`: add `fetchList` functions mirroring `buildFetchCharacterItems`, preserving the existing owner/quantity display and permissions exactly as implemented today in `CharacterTreasuresHelper.jsx`/`BaseCharacterTreasuresController`.
- Retire the now-unused bespoke controllers/helpers (`GamesController.js`, `GameCharactersHelper.jsx`, `GamePcsController.js`, `GameNpcsController.js`, `PcCharacterTreasuresController.js`, `NpcCharacterTreasuresController.js`, `BaseCharacterTreasuresController.js`, `CharacterTreasuresHelper.jsx`, `TreasuresController.js`, `TreasuresHelper.jsx`) once their pages are migrated, same as `GameTreasuresController.js` was retired in #443.

## Benefits
- Every list page in the app (except sessions, polls, staff users, and photo galleries) shares one data-fetching/pagination/rendering implementation, so future list-page features (new filters, new badges) are written once.
- Removes duplicated permission-gating and endpoint-selection logic scattered across per-page controllers.
- Frontend-only refactor with no visible behavior change for users.
