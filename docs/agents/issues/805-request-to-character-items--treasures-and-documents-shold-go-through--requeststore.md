# Issue: Request to Character items, treasures and documents should go through `RequestStore`

## Description
On the character show pages (PC and NPC), the item, treasure, and document previews are fetched directly through `CharacterClient`, bypassing `RequestStore`. Because of this, these previews do not benefit from the permission-aware resolution (editor vs. regular user) that `RequestStore` already provides elsewhere in the app.

## Problem
`CharacterController#loadCharacter` fetches the base character record through `RequestStore.ensure` (resource `pc`/`npc`), but the subsequent `CharacterListsController` methods `fetchAndMergeTreasures`, `fetchAndMergeItems`, and `fetchAndMergeDocuments` call `CharacterClient` HTTP methods directly instead. This means the item/treasure/document previews shown on:

- `/#/games/:game_slug/pcs/:id`
- `/#/games/:game_slug/npcs/:id`

do not go through the permission resolution (`RequestPermissionResolvers`) that determines whether a viewer sees the restricted (editor) or public, hidden-filtered variant of these lists. The standalone list pages (e.g. `/games/:slug/pcs/:id/items`) and the Game show page's PC/NPC previews (`GameController`) already fetch through `RequestStore` correctly and can serve as the reference pattern.

## Expected Behavior
On both the PC and NPC character show pages, the item, treasure, and document previews should resolve permissions through `RequestStore`, consistently with how the standalone item/treasure/document list pages and the Game show page's PC/NPC previews already behave. Editors and regular users should see the correctly scoped data for these previews without any difference in behavior from before, aside from now being permission-aware.

## Solution
Rewire `CharacterListsController`'s `fetchAndMergeTreasures`, `fetchAndMergeItems`, and `fetchAndMergeDocuments` to call `RequestStore.ensure` using the existing resource configs already used by the standalone list pages (`characterListTypes.js`, `characterTreasureListTypes.js`, `documentListTypes.js`), following the same pattern as `GameController`'s `#fetchPcsPreview`/`#fetchNpcsPreview`. The current preview page-size limit should be preserved by passing the equivalent `per_page` query param, as `GameController` already does for its previews.

Once nothing calls the old `CharacterClient` methods (`fetchCharacterTreasures`/`fetchCharacterItems`/`fetchCharacterDocuments`), they should be removed to avoid leaving a dead parallel code path.

Photo previews (`fetchAndMergePhotos`) are out of scope for this issue: unlike items/treasures/documents, there is no existing "editor vs. public" endpoint pair for photos on the backend, so migrating them would require new backend work (a `/photos/all.json` route, a permission-gated view, and `allow_hidden` support in `character_photos`) in addition to frontend wiring. This should be tracked as a separate follow-up issue if desired.

## Benefits
- Consistent, permission-aware behavior across all places items/treasures/documents are listed.
- Removes a parallel/duplicate fetch path (`CharacterClient` direct calls) in favor of the shared `RequestStore` plumbing that already exists for this exact use case.
