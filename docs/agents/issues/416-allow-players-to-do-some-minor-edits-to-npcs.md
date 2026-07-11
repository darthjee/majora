# Issue: Allow players to do some minor edits to NPCs

## Description
On the NPC list page (`/#/games/:game_slug/npcs`) and NPC show page (`/#/games/:game_slug/npcs/:id`), any player of the game (not just the game's GM/admin) should be able to perform a small, limited update to an NPC: toggling its slain state.

This depends on #428, which frees `PATCH /games/:game_slug/npcs/:id.json` from the GM-only full update (moved to `PATCH /games/:game_slug/npcs/:id/full.json`).

## Problem
Today, editing any NPC field (including `slain`/`public_slain`) requires `CharacterEditPermission` (superuser, GM of the game, or the character's owning player — moot for NPCs, which have no owner). There is no existing authorization path for "any player of this game, regardless of character ownership." The closest existing concept is the `is_player` flag (added in #410, exposed on `GET .../access.json` endpoints), computed from `Player.games`. This issue reuses that same `is_player` computation for the new permission check; populating `Player.games` itself (so `is_player` is ever `true` in practice) is out of scope here and tracked separately.

## Expected Behavior
- A player of the game (per the same `is_player` computation used on `.../access.json`) can `PATCH /games/:game_slug/npcs/:id.json` with `{ "slain": true|false }`, which updates the NPC's `public_slain` attribute (not the real `slain` attribute, which stays GM-only via `full.json`).
- No other field is writable through this endpoint for players.
- The plain endpoint's backend permission allows both: a player of the game (new check) OR the existing `CharacterEditPermission` (GM/superuser) — so DMs/superusers are not locked out of it server-side. The frontend, however, only uses the plain endpoint for the new player-facing buttons; the existing DM edit form and DM slain toggle keep using `full.json` (per #428).
- On the NPC index and show pages, a player of the game sees "Revive"/"Mark as Slain" buttons using the `bi-heart-fill`/`bi-skull-fill` icons (same icon set as the DM's real-slain toggle, reused as-is for the player-facing case), opening the same confirmation modal as the DM's, gated on `is_player` and on the NPC's current `slain` (aliased `public_slain`) value.

## Solution
- Backend: add a permission check for "is a player of this game," reusing the same computation backing `is_player` on the access endpoints, allowed in addition to (not instead of) `CharacterEditPermission` on the plain NPC PATCH endpoint. Add a minimal update serializer accepting only `slain` (mapped to `public_slain`) for that endpoint — following the shape of the now-deleted `CharacterSlainUpdateSerializer`/`_slain_set.py` (removed in #425/#426) but with the new permission and field mapping.
- Frontend: wire new player-facing Revive/Mark-as-Slain buttons on `GameNpcs.jsx`/`NpcCharacter.jsx`, gated on `is_player`, reusing `SlainConfirmModal`/`SlainConfirmController` (or a variant) with a client call to the plain endpoint. The existing DM-facing buttons/edit form keep calling `full.json`, unaffected.
- Update `docs/agents/product.md` (new editing-rule branch: player-of-game can toggle NPC `public_slain`) and `docs/agents/access-control.md` in the same PR.

## Benefits
Lets players interact with NPCs during a session (e.g. marking a defeated enemy as slain) without needing the GM to make the change, while keeping full NPC control GM-only.

---

Tags: :shipit:
