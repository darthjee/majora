# Issue: Add edit item button

## Description
The item show pages are missing an edit button/link, so there is currently no way to navigate from an item's detail page to its edit page through the UI. This affects three routes:
- `/#/games/:game_slug/items/:id` (standalone item)
- `/#/games/:game_slug/pcs/:character_id/items/:id` (PC-owned item)
- `/#/games/:game_slug/npcs/:character_id/items/:id` (NPC-owned item)

## Problem
The corresponding edit pages and routes already exist (`.../items/:id/edit`, `.../pcs/:character_id/items/:id/edit`, `.../npcs/:character_id/items/:id/edit`), but the show pages render no link to them. Users who are allowed to edit an item have no way to reach the edit page except by typing the URL manually.

## Expected Behavior
On each of the three item show pages, when the current user has `can_edit` permission on the item (the same permission that already gates access to the item's edit page and its elevated `full.json` fetch), an Edit button is shown (next to the existing back button, in the page actions area) that navigates to the corresponding edit route:
- `/#/games/:game_slug/items/:id` → `/#/games/:game_slug/items/:id/edit`
- `/#/games/:game_slug/pcs/:character_id/items/:id` → `/#/games/:game_slug/pcs/:character_id/items/:id/edit`
- `/#/games/:game_slug/npcs/:character_id/items/:id` → `/#/games/:game_slug/npcs/:character_id/items/:id/edit`

When the current user does not have `can_edit` permission, no edit button is shown.

## Solution
Follow the existing edit-button pattern used on the game and character show pages (`GameHelper.jsx`, `CharacterHelper.jsx`): render a shared `EditButton` wrapped in `ConditionalComponent`, passed as `pageActions` to `ShowPageLayout`.

- Add the `pageActions`/`EditButton` rendering to the shared `ItemDetailHelper.jsx`, parameterized with a `canEdit` flag and an edit href.
- `GameItem.jsx` and `CharacterItem.jsx` (shared by the PC and NPC item pages) build the per-context edit href and pass down a `canEdit` flag.
- Items already have a `can_edit` permission resolved via `AccessStore.ensureGamePermissions`/`ensureCharacterPermissions` (the same source `RequestPermissionResolvers` uses internally to pick between `full.json` and the player-facing endpoint for the item fetch), but it is not currently exposed to the show-page components. `GameItemController.js` and `CharacterItemDetailController.js` need to derive and expose this `can_edit` value (distinct from the existing, broader `canUploadPhoto` derivation) alongside the item fetch.

## Benefits
Restores parity with the edit affordance already present on game and character show pages, and lets users reach the item edit page without manually editing the URL.
