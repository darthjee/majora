# Plan: Add give treasures

Issue: [1001-add-give-treasures.md](../issues/1001-add-give-treasures.md)

## Overview

Add a "Give Treasure" modal, parallel to the existing give-item flow, reachable from a new
game-scoped single-treasure detail page (`GameTreasure.jsx`, mirroring `GameItem.jsx`). Unlike
items, `CharacterTreasure` already carries a `quantity` field and `GameTreasure` already has a
maximum-availability concept (`available_units`), so the modal fires one `quantity`-bearing
`acquire` request per selected character (reusing the existing acquire endpoints as-is) and caps
the running total across all pending recipients client-side against `available_units`. The only
new backend surface is a per-character "how much does this character already own" summary
endpoint, mirroring the one items already have.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [cache](cache.md)
- [translator](translator.md)

## Shared contracts

- **New summary endpoints** (backend produces, frontend consumes): `GET
  games/:game_slug/treasures/:treasure_id/pcs/:id/summary.json`,
  `.../npcs/:id/summary.json` (both `AllowAny`, `X-Skip-Cache: true`, mirroring item's `AllowAny`
  summary shape — NPC variant additionally 404s on a hidden NPC when the requester can't edit the
  game), and their DM/admin-only `.../summary/all.json` counterparts (same permission tier as
  item's: `CharacterTreasureCreatePermission`'s `restricted.create`, checked *before* resolving the
  NPC on the NPC variant so an unauthorized caller can't distinguish hidden-vs-nonexistent). All
  four return `{ "quantity": <int> }` — the character's current `CharacterTreasure.quantity` for
  that treasure, `0` when no such row exists.

- **Existing `treasure.single`** (`GET games/:game_slug/treasures/:id.json`, unchanged): already
  returns `available_units` (`int|null`) and `max_units` via `TreasureDetailSerializer` +
  `GameTreasureFieldsMixin`. `GameTreasure.jsx`/`GiveTreasureModal` rely on `available_units` for
  the live pool cap — no backend change needed to expose it.

- **Existing `treasure.acquire`/`treasure.acquireAll`** (`POST
  games/:game_slug/:kind/:id/treasures/acquire.json` / `.../acquire/all.json`, unchanged): accept
  `{ treasure_id, quantity }`, return `{ quantity: <character's new total>, money: <unchanged>,
  acquired: <amount actually applied this call> }`. The frontend compares `acquired` against the
  row's requested `pendingQuantity` to detect server-side truncation (the residual race after the
  client-side cap), same pattern `AcquireTreasureTabController` already uses for its own
  `partialNotice`.

- **New i18n namespace** (translator produces, frontend consumes): `give_treasure_modal.*` keys,
  mirroring `give_item_modal.*`'s key names 1:1 (`title`, `pc_tab`, `npc_tab`,
  `search_placeholder`, `cancel`, `clear`, `submit`, `owned_quantity_tooltip`,
  `pending_quantity_tooltip`, `increment_tooltip`, `decrement_tooltip`,
  `remove_character_tooltip`, `loading`, `load_error`, `result_success`, `result_failure`), plus
  two treasure-specific additions for the pool cap: `remaining_units` (live remaining-pool label)
  and `partially_fulfilled` (reused wording from `treasure_exchange_modal.partially_fulfilled`).
