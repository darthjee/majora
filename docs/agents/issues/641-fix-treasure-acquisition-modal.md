# Issue: Fix treasure acquisition modal

## Description
When browsing/acquiring treasures from a character's treasure exchange modal (Acquire tab), the frontend must pick between two backend endpoints depending on whether the requester may see hidden treasures:
- `/games/:game_slug/treasures.json` (and `/treasures/acquire.json`) — accessible by anyone.
- `/games/:game_slug/treasures/all.json` (and `/treasures/acquire/all.json`) — DM/superuser only, includes hidden treasures.

This only covers where the frontend routes the request; endpoint permissions themselves are correct and out of scope.

## Problem
The endpoint choice is currently driven by the character-level `can_edit` flag (from `/games/:game_slug/pcs|npcs/:id/permissions.json`, i.e. `Character.can_be_edited_by`), which is true for a DM, a superuser, **or the PC's own owning player** (`Character.editors` includes the owning player for PCs).

The `all.json`/`acquire/all.json` endpoints are gated by `GameEditPermission` (`Game.can_be_edited_by`), which is DM/superuser only — no owner bypass.

As a result, any player who owns their PC gets `can_edit: true` from the character permissions check, the modal routes their Acquire tab through `treasures/all.json`, and the backend correctly rejects it with 403 — breaking the Acquire tab for that player's own character. (NPCs happen to be unaffected today: an NPC has no owner, so its character-level `can_edit` collapses to exactly DM-or-superuser, coincidentally matching the game-level permission — but the same wrong signal is used there too, in `BaseCharacterTreasuresController`'s NPC treasures-list fetch.)

## Expected Behavior
Opening the treasure exchange modal (or the NPC treasures list) for a character owned by a regular player, who is not a DM or superuser for that game, should always succeed, routing through the public `treasures.json`/`treasures/acquire.json` endpoints. Only an actual DM or superuser of the game should be routed through the `all.json`/`acquire/all.json` endpoints.

## Solution
Replace every place that currently uses the character-level `can_edit` (`AccessStore.ensureCharacterPermissions`) as the signal for choosing between the `all.json` and plain treasure endpoints with the game-level `can_edit` (`AccessStore.ensureGamePermissions(gameSlug)`, backed by `GamePermissionsSerializer`/`Game.can_be_edited_by` — DM/superuser only), so the decision matches exactly what the backend actually authorizes. This affects both:
- The treasure exchange modal's Acquire tab (`CharacterTreasures.buildExchangeCharacter` / `TreasureExchangeModal` / `TreasureExchangeModalController`).
- The NPC treasures list fetch in `BaseCharacterTreasuresController`.

The character-level `can_edit` permission itself is unaffected and continues to gate actual character-editing actions elsewhere.

## Benefits
Fixes the 403 currently hit by any player opening the treasure exchange modal for their own PC. Keeps hidden-treasure browsing/acquiring restricted to DM/superuser as intended. Makes the endpoint-routing logic correct by construction (matching the actual backend permission) instead of correct by coincidence for NPCs only.
