# Issue: Update slain using patch endpoint

## Description
NPC `slain` and `public_slain` flags — surfaced in the NPC list (`/#/games/:game_slug/npcs`) and NPC detail (`/#/games/:game_slug/npcs/:id`) pages — are currently updated through a dedicated endpoint, `PATCH /games/:game_slug/npcs/:id/slain.json`, separate from the general NPC update endpoint, `PATCH /games/:game_slug/npcs/:id.json`.

## Problem
Both endpoints independently enforce the same permission check (`CharacterEditPermission` / `can_be_edited_by`), so the slain-specific endpoint is a second place that rule has to be kept in sync. It also stands in the way of a planned follow-up: introducing a dedicated endpoint for players to edit a restricted set of NPC attributes, which should be the only endpoint that needs its own (looser) permission rule.

## Expected Behavior
`slain` and `public_slain` are updated via `PATCH /games/:game_slug/npcs/:id.json` (the same endpoint used for other NPC edits), and the dedicated `PATCH /games/:game_slug/npcs/:id/slain.json` endpoint is removed.

## Solution
- Add `slain` and `public_slain` as optional, writable fields on `CharacterUpdateSerializer` (`source/games/serializers/character_update.py`) — the serializer already used by both the NPC and PC PATCH endpoints via `detail_or_update`/`character_detail`. Sharing it means these fields also become writable on player characters, which is acceptable.
- Update the frontend to PATCH the main NPC endpoint instead of the slain-specific one: `CharacterClient.setNpcSlain` (`frontend/assets/js/client/CharacterClient.js`) and its caller `SlainConfirmController` (`frontend/assets/js/components/elements/controllers/SlainConfirmController.js`), used from the NPC list (`GameNpcs.jsx`) and NPC detail (`NpcCharacter.jsx`) pages. The confirmation UX itself (modal before toggling) stays unchanged — only the endpoint being called changes.
- Remove the dedicated endpoint entirely: URL route (`source/games/urls.py`), view (`source/games/views/characters/game_npc_slain_set.py`, `_slain_set.py`), and serializer (`source/games/serializers/character_slain_update.py`), along with their tests (`source/games/tests/views/characters/game_npc_slain_set_test.py`).
- Update or remove the now-obsolete frontend specs tied to the old endpoint (`setNpcSlainSpec.js`, `SlainConfirmControllerSpec.js`, and related helper/modal specs) to reflect the new call target.

## Benefits
- A single point of permission enforcement for NPC (and PC) edits.
- Frees up the `slain.json` endpoint slot to introduce a future player-facing endpoint for updating a restricted set of NPC attributes, without conflicting with GM-only editing logic.
