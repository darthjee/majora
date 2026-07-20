# Plan: Staff should be able to edit treasure

Issue: [712-staff-should-be-able-to-edit-treasure.md](../../issues/712-staff-should-be-able-to-edit-treasure.md)

## Overview

Add a global-Staff bypass to the PC/NPC treasure acquire/sell endpoints, mirroring the existing
`CharacterMoneyEditPermission` staff-bypass pattern but without its "any player of the game"
leniency (per the issue's clarified Staff principle: admin-like power, minus spoilers/secrets).
The DM-only hidden-treasure `acquire/all.json` variant is untouched — it's gated by
`GameEditPermission` first, which has no staff bypass, so staff naturally stays excluded from it.
Backend exposes the new permission as a `can_exchange_treasure` field on the character detail
response; frontend swaps the "Exchange Treasure" button's gating from the unrelated `can_edit`
field to this new one.

Money editing for staff (the other half of the original issue text) is already fully implemented
end-to-end (`/money.json` + `CharacterMoneyEditPermission`) — no work needed there.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- **New response field**: `can_exchange_treasure` (boolean), added to `CharacterDetailSerializer`
  (`backend/games/serializers/characters/character_detail.py`), returned on
  `GET /games/:game_slug/pcs/:id.json` and `GET /games/:game_slug/npcs/:id.json` — the same
  endpoint the frontend already calls via `CharacterClient.fetchCharacter`, which is what
  populates the `character` state in `CharacterContextController`
  (`frontend/assets/js/components/resources/character/pages/controllers/CharacterContextController.js`).
  `true` when the requesting user is a superuser, that game's DM, (for PCs) the character's own
  owning player, or any global Staff account (`user.is_staff`) — computed by a new
  `CharacterTreasureExchangePermission.is_allowed(user, character)` classmethod in
  `backend/games/permissions.py`, mirroring `CharacterMoneyEditPermission.is_allowed`'s shape but
  without the PC "any player of the game" branch.
- This field is populated on the initial character-detail fetch and is **not** touched by
  `CharacterContextController#mergeAccess` (which only overwrites `can_edit`/`game_can_edit` via
  the separate `permissions.json`/`AccessStore` role-simulation path) — so the frontend can read
  `character.can_exchange_treasure` directly off the merged character state, exactly like
  `character.can_edit_money` already works for the money-edit link.
- `game_can_edit` (DM/superuser only, used by `buildExchangeCharacter` to pick between the
  regular and `all.json` acquire endpoints in the modal) is **unchanged** — staff must keep using
  the regular acquire endpoint, never the hidden-treasure `all.json` one.
