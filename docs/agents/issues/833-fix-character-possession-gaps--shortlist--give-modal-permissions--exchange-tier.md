# Issue: Fix character possession gaps: shortlist, give-modal permissions, exchange tier

## Description
`CharacterPossession` was added end-to-end in #1076 / PR #1102: the thin-shell model delegating to `GamePossession`, the `/#/games/:game_slug/(n)pcs/:id/possessions` list page, and the acquire/remove exchange modal. This issue is re-scoped down to three concrete, verified gaps/bugs left over from that work — everything else originally requested is done.

## Problem

### 1. Missing shortlist on the PC/NPC show page

The very first ask in this issue — a possessions shortlist on `/#/games/:game_slug/(n)pcs/:id`, "like we do for CharacterDocument" — was never built. `pcShowType.js` and `npcShowType.js` both call `buildShortListSlot('treasure')`, `buildShortListSlot('item')`, `buildShortListSlot('document')` in their `right` slot array, but there is no `buildShortListSlot('possession')`. Correspondingly, `shortListResourceConfig.js` (`frontend/assets/js/components/common/cards/shortListResourceConfig.js`) has entries for `pc`, `npc`, `treasure`, `item`, `document` — but no `possession` entry, and there is no `PossessionPreviewCard` component (unlike `ItemPreviewCard`/`DocumentPreviewCard`).

### 2. Give-document modal routes through the wrong permission tier (live bug)

Observed directly: on `/#/games/tirania_dos_dragoes/documents/3`, using the give-document modal as staff/player fails because the acquire request goes through the restricted endpoint.

Root cause: `GameDocument.jsx` passes `canGiveHidden={canEdit}` to `GiveDocumentModal`, where `canEdit` comes from `GameDocumentController#loadCanEdit` → `AccessStore.ensureDocumentPermissions(gameSlug).can_edit` — the document's `regular.edit` tier (**staff + player**, per #1098). `GiveDocumentModalController#acquire` then picks `variantName: canGiveHidden ? 'private' : 'regular'`, so any staff/player user (for whom `canEdit` is always `true`) submits through `/documents/acquire/all.json`. On the backend, `_check_document_create` gives that variant the `restricted` tier, which — unlike `regular` — is **admin/dm only** (no staff/player grant). Result: staff/player always 403 on the give-document modal, even for a non-hidden document, regardless of whether they actually needed the hidden-bypass variant.

`canGiveHidden` should reflect "may this user acquire on behalf of a *hidden* document" (i.e. the `restricted`/admin-dm-only permission), not "may this user edit the document's fields" (`regular.edit`, staff+player). Conflating the two is the bug.

#### Same pattern in Item and Treasure (latent, not yet symptomatic)

`GiveItemModal`/`GiveItemModalController` and `GiveTreasureModal`/`GiveTreasureModalController` have the identical wiring: `canEdit` (from `ensureItemPermissions`/treasure's own `can_edit`) is passed straight through as `canGiveHidden`, picking `'private'` vs `'regular'` the same way. This hasn't caused a visible permission failure there only because `_check_item_create` and the treasure exchange check are *already* unconditionally `restricted` regardless of variant — so picking the wrong variant doesn't change the outcome today. It's still the same incorrect derivation, and should be fixed for consistency (and to stop needlessly hitting the `/all.json` hidden-bypass variant for non-hidden items/treasure).

### 3. Possession exchange doesn't follow documents' permission split

This issue originally asked for possession exchange to "follow the permissions of documents" — i.e. mirror `_document_exchange.py`'s tiering, where the plain endpoint is `regular` (staff + player can self-serve) and only the `/all.json` DM-bypass variant is `restricted` (admin/dm only).

`_possession_exchange.py`'s actual implementation (from #1076) is unconditionally `restricted` for both `/possessions/acquire.json` and `/possessions/remove.json` (plain) and their `/all.json` counterparts. In practice this means **players can never acquire or remove their own possessions** — only staff/DM/admin can. This was a deliberate choice in #1076 (possessions framed as closer to Item's model than Document's), but it contradicts what this issue asked for, and the issue was never updated to reflect the deviation.

## Solution

### 1. Add possession shortlist

Add a `possession` entry to `shortListResourceConfig.js` (mirroring the `document` entry: `characterResourceParams`/`characterResourceSeeAllHref('possession', context)`, href to `.../possessions/:id`), a `PossessionPreviewCard` component, and wire `{ Show: buildShortListSlot('possession') }` into both `pcShowType.js` and `npcShowType.js`'s `right` arrays alongside the existing `treasure`/`item`/`document` entries.

### 2. Fix give-modal permission derivation (Document, Item, Treasure)

Derive `canGiveHidden` from the actual restricted-tier acquire permission (admin/dm), not `can_edit`. Likely needs a new field on `/permissions/game_document.json` (or reuse of the existing `_check_document_create('restricted', 'create')` shape) distinct from `can_edit`, threaded through `GameDocumentController` into the `canGiveHidden` prop. Apply the same correction to `GameItem.jsx`/`GiveItemModal` and `GameTreasure.jsx`/`GiveTreasureModal`.

### 3. Vary possession exchange permission tier

Change `_check_possession_create` (`backend/games/views/game/_possession_exchange.py`) so the tier varies by endpoint variant, mirroring `_document_exchange.py`:
- `/possessions/acquire.json` / `/possessions/remove.json` (plain) → `regular` tier → `staff`, `player`, `owner` (PC) / `staff`, `player` (NPC)
- `/possessions/acquire/all.json` / `/possessions/remove/all.json` (DM bypass) → `restricted` tier → admin/dm only

This needs a corresponding permission config change (see `backend/permissions/config/game_pc_item`/`game_pc_document` for the existing regular/restricted precedent), and existing tests under `backend/games/tests/views/game/{pcs,npcs}/detail/possessions/` will need updating for the new expected permission matrix on the plain `acquire`/`remove` endpoints.

### Scope

- **#1**: frontend only (`shortListResourceConfig.js`, new `PossessionPreviewCard`, `pcShowType.js`/`npcShowType.js`).
- **#2**: backend (a new permission field/endpoint distinct from `can_edit`) + frontend (`GameDocumentController`, `GameItemController`, `GameTreasure*` wiring the corrected `canGiveHidden`).
- **#3**: backend only (`_possession_exchange.py` + permission config + existing possession-exchange test updates).
