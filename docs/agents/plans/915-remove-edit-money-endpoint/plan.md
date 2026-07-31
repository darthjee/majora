# Plan: Remove edit money endpoint

Issue: [915-remove-edit-money-endpoint.md](../../issues/915-remove-edit-money-endpoint.md)

## Overview

Remove the dedicated PC/NPC money-only endpoints (`PUT .../pcs/:id/money.json`, `PUT .../npcs/:id/money.json`) and the `money_edit` permission, relying on the regular PATCH endpoints instead. PCs already accept `money` on PATCH with an identical permission set, so this is a pure removal there. NPCs need two real changes to preserve current capability: `money` becomes a writable field on the NPC PATCH serializer, and the NPC PATCH permission (`player_edit`) gains the `staff` role (previously only reachable through the money-only endpoint), giving staff full NPC edit access via PATCH — consistent with how PC staff access already works.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- **Removed endpoints** (return 404 after this change): `PUT /games/:game_slug/pcs/:id/money.json`, `PUT /games/:game_slug/npcs/:id/money.json`.
- **PATCH `/games/:game_slug/pcs/:id.json`**: unchanged — already accepts `money` (integer) in the request body, gated by `game_pc`/`regular_edit` (`staff`, `player`, `owner` + admin/dm).
- **PATCH `/games/:game_slug/npcs/:id.json`**: now accepts `money` (integer, optional) in the request body. Gated by `game_npc`/`player_edit`, which now additionally allows role `staff` (previously only `player` + admin/dm).
- **`permissions.json` response**: the `can_edit_money` field is removed entirely (for both `character_pc` and `character_npc` page configs) — it is no longer computed or returned. Frontend must stop reading it.
- **Frontend money-edit UX**: the existing "quick edit" money modal (`MoneyEditModal` on the character detail page) keeps working exactly as before from a UX standpoint, but its submit path changes from `PUT .../money.json` to `PATCH .../:id.json` with body `{ money: <int> }`, and its visibility gate changes from `character.can_edit_money` to `character.can_edit`.

## Notes

- No database/migration changes — `Character.money` already exists and is already writable for PCs.
- This is a behavior change for NPCs: `staff` (global `is_staff`, not just admin/dm) gains the ability to edit NPC `name`, `role`, `public_description`, `public_allegiance`, `public_slain`, and `links` via PATCH, not just `money` — this was explicitly confirmed during issue discussion as the desired outcome (matching existing PC staff behavior).
