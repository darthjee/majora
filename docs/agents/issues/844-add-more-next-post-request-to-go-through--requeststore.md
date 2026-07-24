# Issue: Add more next POST request to go through `RequestStore`

## Description
Follow-up to #841 (implemented in commit `0dbe0ebe6cbc49d1930095acd107d3380ed096fa`), continuing the `RequestStore` mutation migration (see [docs/agents/migration/README.md](docs/agents/migration/README.md) for the general approach) for a further batch of routes: character exchange-modal mutations, character profile-photo/photo-upload, game-level treasure/photo-upload pages, and game create/edit.

Two routes originally proposed for this batch — `/#/games/:game_slug/treasures/new` and `/#/games/:game_slug/treasures/:id/edit` — turned out to already be migrated by #841 (confirmed in `GameTreasureNewController.js` and `GameTreasureEditController.js`, both already calling `RequestStore.mutate`) and are dropped from scope here.

## Problem
- The character exchange-modal tabs (acquire/remove/buy/sell item or treasure) still resolve mutations via `CharacterClient` (`acquireItem`/`removeItem`/`acquireTreasure`/`removeTreasure`/`buyTreasure`/`sellTreasure`), duplicating logic `RequestStore` already centralizes for `GET`.
- Character profile-photo selection (`CharacterClient.setPhotoRoles`) and the underlying photo-upload flow (`PhotoUploadModalController`/`UploadClient`) are not yet on `RequestStore`, so a successful mutation can leave the character's `GET` cache stale.
- The game-level treasures index and photos index pages' photo-upload flows have the same staleness gap.
- `/#/games/new` and `/#/games/:game_slug/edit` still resolve mutations via `GameClient` (`createGame`/`updateGame`).

## Expected Behavior
- `POST`/`PATCH`/`PUT` requests for the routes listed under "Next routes" (Solution, below) go through `RequestStore`, resolving the correct URL/permission variant the same way `GET` already does for these resources.
- After each mutation, `RequestStore`'s cached (settled, not in-flight) `GET` data for the affected resource is purged; an in-flight `GET` for that resource is aborted and restarted instead, same as #830/#841.
- Photo-upload completions purge the owning character/resource's own show/index `GET` cache.
- Mutation requests never participate in `GET`'s de-dupe/attach/cache mechanic.
- `docs/agents/migration/README.md`'s route checklist is updated to reflect this batch.

## Solution
Extend the relevant resource configs with `POST`/`PATCH`/`PUT` entries and wire the routes below through `RequestStore.mutate` (or `resolvePath`-only for photo-upload-init), following the pattern in [docs/agents/migration/README.md](docs/agents/migration/README.md).

### Next routes
- [ ] Exchange modal — acquire/remove item (`AcquireItemTabController`, `RemoveItemTabController`), shared by both `/#/games/:game_slug/pcs/:character_id/items` and `/#/games/:game_slug/npcs/:character_id/items` (same `ResourceExchangeModal.jsx`/tab-controller code, parameterized by `characterKind`)
- [ ] Exchange modal — acquire/remove/buy/sell treasure (`AcquireTreasureTabController`, `RemoveTreasureTabController`, `BuyTreasureTabController`, `SellTreasureTabController`), shared by both `/#/games/:game_slug/pcs/:character_id/treasures` and `/#/games/:game_slug/npcs/:character_id/treasures`
- [ ] Character profile-photo selection (`BaseCharacterPhotosController#setProfilePhoto` → `CharacterClient.setPhotoRoles`), shared by `/#/games/:game_slug/pcs/:character_id/photos` and `/#/games/:game_slug/npcs/:character_id/photos`
- [ ] Photo-upload path resolution (`PhotoUploadModalController`/`UploadClient`) — migrated once as a single shared change, covering all four call sites: character photos (`/#/games/:game_slug/pcs/:character_id/photos`, `/#/games/:game_slug/npcs/:character_id/photos`), `/#/games/:game_slug/treasures` photo upload, and `/#/games/:game_slug/photos` photo upload
- [ ] `/#/games/new` (`GameNewController.js` → `GameClient.createGame`)
- [ ] `/#/games/:game_slug/edit` (`GameEditController.js` → `GameClient.updateGame`)

### Already migrated (dropped from this issue's scope)
- `/#/games/:game_slug/treasures/new` (#841)
- `/#/games/:game_slug/treasures/:id/edit` (#841)

### Components leak
If a component is found to be used in one of these pages but also in a page not listed here, it can still be migrated — the other page does not need to be migrated in full as part of this issue.
