# Issue: Add select item from list

## Description
On the character Items pages (PC and NPC), there is currently a list of `CharacterItem`s and a "Create Item" button that opens a full-page form to build a brand-new `GameItem` from scratch (along with its linked `CharacterItem`). There is no way to create a `CharacterItem` from an existing `GameItem` already in the game's item catalog, and no way to remove a `CharacterItem` from that page at all.

The PC/NPC Treasures pages already solve an equivalent problem for treasures via the `TreasureExchangeModal`, a tab-composed modal (Buy / Sell / Acquire / Remove tabs, each backed by its own configurable component) that lets a player or DM pick an existing `GameTreasure` from the catalog and acquire/remove/buy/sell it against the character. This issue generalizes that same modal (and its tab-configuration mechanism) so it can also drive Acquire/Remove of `CharacterItem`s from the `GameItem` catalog, reusing the modal shell and the `Acquire`/`Remove` tab pattern with an item-specific configuration.

## Problem
- There is no way to create a `CharacterItem` for a PC/NPC by picking an existing `GameItem` from the game's catalog — the only existing "Create Item" flow always creates a brand-new `GameItem` from scratch.
- There is no way to remove a `CharacterItem` from a character at all today.
- Unlike `CharacterTreasure`, `CharacterItem` has no `quantity` concept — `unique_together = [('character', 'game_item')]` means a character can hold at most one `CharacterItem` per `GameItem`. So "Acquire" here means create-the-link-if-absent, and "Remove" means delete the row, not increment/decrement a quantity like treasures do. Since there's no quantity to fall back on, the Acquire catalog must exclude `GameItem`s the character already owns rather than letting the user pick a duplicate.

## Expected Behavior
- From the PC/NPC Items page, a user with role dm, admin, staff, or player (owner) sees a new button (alongside the existing "Create Item" button, which is unchanged and keeps creating a brand-new `GameItem` + `CharacterItem` from scratch) that opens the generalized exchange modal, configured for items (Acquire + Remove tabs only — no Buy/Sell, those stay treasure-only).
- **Acquire tab**: browses the game's `GameItem` catalog *excluding items the character already owns* (via the new `available`/`available/all` endpoints below — not the plain catalog endpoint), lets the user pick one, and confirm. No quantity input (items don't have quantity), and no duplicate-acquire case to handle since already-owned items never appear in the list. A "hidden" switch lets the user mark the resulting `CharacterItem` as hidden, defaulting to the picked `GameItem`'s own `hidden` value but overridable. Confirming creates a `CharacterItem` from the `GameItem` with empty `description`/photo (so it falls back to displaying the `GameItem`'s own info), respecting the submitted `hidden` value.
- **Remove tab**: browses the character's currently owned `CharacterItem`s, lets the user pick one, and confirm removal. No quantity input.
- Tooltip copy: Acquire tab = "Acquire a copy of the item"; Remove tab = "Removes an item".
- A public (non-DM) user only ever sees/acts on non-hidden `GameItem`s/`CharacterItem`s; hidden ones 404 for them. DM/admin/staff have "restricted" (`/all.json`) endpoint variants that see/act on hidden ones too, matching the existing treasure pattern.

## Solution

### Frontend
- Generalize `TreasureExchangeModal` (`frontend/assets/js/components/resources/character/pages/elements/TreasureExchangeModal.jsx`) under a more generic name. Its docstring already anticipates this reuse, and it already delegates entirely to a tab-configuration map (`treasureExchangeTabs.js`) rendered by `TreasureExchangeModalHelper.jsx` — the shell itself needs no behavioral changes, only a rename and, if needed, generalizing any treasure-specific prop names.
- Add a new item tab-configuration map (parallel to `treasureExchangeTabs.js`) listing only `acquire` and `remove` tabs, each with its own label/tooltip and component.
- Add new `AcquireItemTab`/`RemoveItemTab` components, modeled on `AcquireTreasureTab.jsx`/`RemoveTreasureTab.jsx` but without the quantity input, plus the "hidden" switch on Acquire (defaulting to the selected `GameItem.hidden`).
- Add corresponding tab controllers (modeled on `AcquireTreasureTabController.js`/`RemoveTreasureTabController.js`) that call the new item acquire/remove client endpoints below.
- `itemConfig.js` (`frontend/assets/js/utils/requests/config/itemConfig.js`) already supports fetching a character's owned items (`kind: 'pcs'|'npcs'`) for the Remove tab. Add a new collection entry backed by the `available`/`available/all` endpoints below for the Acquire tab, instead of the plain `GameItem` catalog endpoint — this is what keeps already-owned items out of the Acquire list (see Problem) and, on the restricted variant, keeps hidden-item visibility consistent with the existing `items/all.json` pattern.
- Wire the modal's trigger button into `CharacterItems.jsx`/`CharacterItemsHelper.jsx` (`frontend/.../pages/shared/CharacterItems.jsx`), visible to dm, admin, staff, and player (owner) — same visibility rule as the treasure exchange button.

### Backend
New endpoints, following the exact permission/routing pattern already used for treasure acquire/remove (`backend/games/urls/_character_routes.py`, `backend/games/views/game/_character_shared.py`, `backend/games/views/game/_treasure_exchange.py`, `CharacterTreasureExchangePermission` in `backend/games/permissions.py`):

#### Character available-items endpoints (Acquire catalog, minus already-owned)
- `GET /game/:game_slug/pcs/:id/items/available.json`
- `GET /game/:game_slug/npcs/:id/items/available.json`

Same visibility/permission as the existing `items.json` endpoint (hidden `GameItem`s excluded). Returns the game's `GameItem` catalog minus the `GameItem`s the character already has a `CharacterItem` for.

- `GET /game/:game_slug/pcs/:id/items/available/all.json`
- `GET /game/:game_slug/npcs/:id/items/available/all.json`

Restricted variant, same visibility/permission as the existing `items/all.json` endpoint (hidden `GameItem`s included). Same already-owned exclusion as above.

#### Character public acquire/remove endpoints
- `POST /game/:game_slug/pcs/:id/items/acquire.json`
- `POST /game/:game_slug/npcs/:id/items/acquire.json`
- `POST /game/:game_slug/pcs/:id/items/remove.json`
- `POST /game/:game_slug/npcs/:id/items/remove.json`

Restricted to dm, admin, staff, and owner.
- Acquire: creates a `CharacterItem` from the `GameItem` (empty description/photo so it defers to `GameItem` info; respects submitted `hidden`). If the `GameItem` is hidden, returns 404 (user has no access to hidden game items).
- Remove: removes the `CharacterItem`. If it is hidden, returns 404 (user has no access to that `CharacterItem`).

#### Character restricted (`/all.json`) acquire/remove endpoints
- `POST /game/:game_slug/pcs/:id/items/acquire/all.json`
- `POST /game/:game_slug/npcs/:id/items/acquire/all.json`
- `POST /game/:game_slug/pcs/:id/items/remove/all.json`
- `POST /game/:game_slug/npcs/:id/items/remove/all.json`

Acquire restricted to dm and admin; remove restricted to dm, admin, and owner. Both work even when the `GameItem`/`CharacterItem` involved is hidden.

No changes to permissions of already-existing endpoints (`items.json`, `items/all.json`, `items/<id>.json`, `items/<id>/full.json`, `items/<id>/photo_upload.json`).

### Affected pages
- `/#/games/:game_slug/pcs/:id/items`
- `/#/games/:game_slug/npcs/:id/items`

### Reference implementation (equivalent existing pages)
- `/#/games/:game_slug/pcs/:id/treasures`
- `/#/games/:game_slug/npcs/:id/treasures`

## Benefits
- Lets players and DMs add existing catalog items to a character without the friction of the full "create new item from scratch" flow, and lets them remove items — closing a gap in the current Items page.
- Reuses a proven, already-generalized UI pattern (the treasure exchange modal) instead of building a parallel one-off, keeping Acquire/Remove UX consistent between Treasures and Items pages.
