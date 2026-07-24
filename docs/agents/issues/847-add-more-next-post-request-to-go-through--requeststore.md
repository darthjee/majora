# Issue: Fix photo upload component leaks and migrate NPC slain toggle to RequestStore

## Description
Continuation of the mutation-to-`RequestStore` migration started in #830 and extended in #841 and #844 (see `docs/agents/migration/README.md` for the full approach and checklist). This issue originally listed 11 candidate routes as the next batch to migrate, but re-checking the current codebase shows most of that list is stale.

## Problem
Of the 11 originally-listed routes:
- 4 are already migrated: `/#/games/:game_slug/documents/new` (#841), `/#/games/:game_slug/photos` upload (#844), `/#/games/new` (#844), `/#/games/:game_slug/edit` (#844).
- 4 have no mutation requests at all (nothing to migrate): `/#/games/:game_slug/pcs`, `/#/games/:game_slug/players`, `/#/games/:game_slug/players/:id`, `/#/games/:game_slug/documents/:id`.
- 1 doesn't exist as a route: `/#/games/:game_slug/documents/:id/edit` (only create and show exist for documents; no edit UI).

The only pages with genuine outstanding mutation work are the game show page (`/#/games/:game_slug`) and the NPC list page (`/#/games/:game_slug/npcs`).

## Solution
**Photo upload component leak** (both resources already have a `POST.single` `photoUploadInit` variant defined in config — it's just not wired up at these two call sites):
- **Game show page** (`Game.jsx`): inline `PhotoUploadModal` builds its own raw path (`` `/games/${game.game_slug}/photo_upload.json` ``) instead of using `gameConfig.js`'s existing `photoUploadInit` variant (already used correctly by the migrated `GamePhotos.jsx`).
- **NPC list page** (`GameNpcs.jsx`): inline `PhotoUploadModal` builds its own raw path (`` `/games/${gameSlug}/npcs/${uploadTarget?.id}/photo_upload.json` ``) instead of using `npcConfig.js`'s existing `photoUploadInit` variant (already used correctly by the migrated `NpcCharacterPhotos` page).

Both should switch to the synchronous, pre-render call shape already established (`resourceConfig.get('POST', resource, 'single').regular.path(params)`), per the migration docs.

**NPC slain toggle**: the same NPC list page also drives the slain toggle via `SlainConfirmController`/`PlayerSlainConfirmController` → `CharacterClient.setNpcSlain`/`setNpcPublicSlainAsPlayer`. Migrate this in the same pass: move it to `RequestStore.mutate` with a matching resource-config entry. Per this issue's own component-leak rule, it's fine that these controllers are also used on the NPC show page (`/#/games/:game_slug/npcs/:character_id`) — migrating the component itself is in scope even though that page isn't otherwise being migrated. Once done, remove this item from `docs/agents/migration/README.md`'s separately-tracked "Character slain toggle" section.

Update `docs/agents/migration/README.md`'s checklist: mark these three items migrated, and drop the stale/incorrect entries from the old "Next routes" list.

## Benefits
Closes out the last two hand-built raw-path photo-upload calls (the "component leak" case this issue originally flagged) plus one more mutation route, while correcting the migration README so it accurately reflects remaining work for future issues.
