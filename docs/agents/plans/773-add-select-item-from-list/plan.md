# Plan: Add select item from list

Issue: [773-add-select-item-from-list.md](../issues/773-add-select-item-from-list.md)

## Overview

Generalize the treasure exchange modal (`TreasureExchangeModal.jsx`) into a reusable
tab-composed modal (its own docstring already anticipates this), and add a new
Acquire/Remove tab pair backing it for `CharacterItem`s. Since `CharacterItem` has no
`quantity` (`unique_together = ('character', 'game_item')`, unlike `CharacterTreasure`), the
Acquire catalog must exclude items the character already owns — this requires two new backend
list endpoints (`items/available.json` / `items/available/all.json`) alongside the new
acquire/remove action endpoints. The existing "Create Item" full-page flow is untouched and
stays alongside the new modal, per user decision during refinement.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### New endpoints (backend produces, frontend consumes)

All under `games/<slug>/pcs|npcs/<id>/items/...`, added to `_CHARACTER_ROUTES`
(`backend/games/urls/_character_routes.py`):

| Path | Method | Permission | Notes |
|---|---|---|---|
| `items/available.json` | GET | same as `items.json` (public, hidden excluded) | `GameItem` catalog minus items the character already owns |
| `items/available/all.json` | GET | `GameEditPermission` (dm/admin **only**, no owner, no staff) | same, hidden `GameItem`s included |
| `items/acquire.json` | POST | `CharacterItemCreatePermission` (dm/admin/staff/owner) | body `{game_item_id, hidden?}` |
| `items/acquire/all.json` | POST | `GameEditPermission` (dm/admin only) | same body, hidden `GameItem` allowed |
| `items/remove.json` | POST | `CharacterItemCreatePermission` (dm/admin/staff/owner) | body `{game_item_id}` |
| `items/remove/all.json` | POST | `_check_character_all_permission` (PC: `CharacterEditPermission` = dm/admin/owner; NPC: `GameEditPermission` = dm/admin) | same body, hidden `CharacterItem` allowed |

Two **distinct** permission scopes are load-bearing here and must not be conflated:
- **Catalog visibility** (`available/all`, `acquire/all`) is *game-level*, dm/admin only, no
  owner — mirrors the existing treasure `acquire/all.json` precedent exactly (a player
  shouldn't get hidden-catalog visibility just by owning the character).
- **Owned-item visibility** (`remove/all`) is *character-level*, using the exact same
  asymmetric PC/NPC split the existing `items/all.json` already uses via
  `_check_character_all_permission` (PC: owner included; NPC: no owner concept).

No new permission classes are needed — `CharacterItemCreatePermission`, `GameEditPermission`,
and `_check_character_all_permission` already implement all three shapes exactly; only their
docstrings need broadening to mention they're now also used by acquire/remove.

Response shapes:
- `available(.json)`/`available/all.json`: paginated `GameItemListSerializer` /
  `GameItemAllListSerializer` (`{id, name, photo_path[, hidden]}`), same shape as
  `/items.json`/`/items/all.json`.
- `acquire(.json)`/`acquire/all.json`: `201` with `CharacterItemDetailFullSerializer` data
  (`{id, game_item_id, name, photo_path, description, hidden}`); `400 {errors: {...}}` if the
  `GameItem` is already owned; `404` if the `GameItem` doesn't exist or is hidden (non-`/all`
  only).
- `remove(.json)`/`remove/all.json`: `204 No Content` on success; `404` if not owned, or owned
  but hidden (non-`/all` only).

### Frontend permission wiring (no new backend field needed)

The character-level `can_create_item` permission (`AccessStore.ensureCharacterPermissions`,
already resolved on the Items page by `CharacterItemsAccessController`) is *exactly*
`CharacterItemCreatePermission` — the same rule the new public acquire/remove endpoints use.
Reuse it as-is to gate the new "Exchange Items" button; no new `can_exchange_item` field is
needed. Submitting through the `/all` endpoints is gated separately per action (see
[frontend.md](frontend.md)): Acquire routes off game-level `can_edit`, Remove off
character-level `can_edit` — both already resolved today by `CharacterContextController`
(currently hardcoded to the treasures page path; frontend generalizes it to accept a
`pagePath` param so `CharacterItems.jsx` can reuse it unchanged otherwise).

### Modal generalization (frontend-internal)

`TreasureExchangeModal.jsx` is renamed to a generic name (`ResourceExchangeModal.jsx`
suggested) and takes its tab config map as a `tabs` prop (plus a `defaultTab` prop) instead of
hardcoding `treasureExchangeTabs`. `CharacterTreasures.jsx` passes `treasureExchangeTabs`
unchanged; the new `CharacterItems.jsx` passes a new `itemExchangeTabs.js` map (Acquire/Remove
only, translator-produced `item_exchange_modal.*` label/tooltip keys).
