# Issue: Allow players to perform NPC photo upload

## Description
On the NPC show page (`/#/games/:game_slug/npcs/:id`) and NPC index page (`/#/games/:game_slug/npcs`), the photo upload flow (upload button + init/finalize requests) is currently GM-only. This depends on #416, which introduces a reusable `NpcPlayerEditPermission` ("is a player of this game OR `CharacterEditPermission`") and merges `is_player` into the NPC show/index page state.

## Problem
NPC photo upload is gated by `CharacterEditPermission` at two points: the init endpoint (`source/games/views/characters/_photo_upload.py`) and the generic upload-finalize endpoint (`source/games/views/upload_finalize.py`, `_check_permission`, dispatching on `CharacterPhoto`). Both currently allow only a superuser, the character's owning player (moot for NPCs), or a GameMaster — never "any player of this game." On the frontend, the upload button's visibility is driven by the same `character.can_edit` / page-level `canEdit` value used for the DM edit button and the DM slain/revive buttons, and — critically — the NPC/PC show page share the exact same `CharacterHelper.jsx`/`CharacterController`, so a naive `is_player`-based relaxation could leak NPC-photo-upload rights onto PC pages unless explicitly guarded by `character.is_pc`.

## Expected Behavior
- A player of the game (per the same `is_player`/`NpcPlayerEditPermission` check from #416) can see and use the upload-photo button for an NPC, on both the show page and the index page.
- PC photo upload is completely unaffected: only the owning player, a GameMaster, or a superuser may upload/see the upload button for a PC, exactly as today.
- Both the upload-init endpoint and the upload-finalize endpoint accept the request from a player of the game, for NPC uploads only.

## Solution
- Backend: reuse `NpcPlayerEditPermission` (from #416) in place of the plain `CharacterEditPermission` check at both `_photo_upload.py` (NPC init) and `upload_finalize.py`'s `_check_permission` (only for the NPC case — i.e. only when `content_object.character.npc` is true; PC finalize keeps using `CharacterEditPermission` unchanged).
- Frontend: on `CharacterHelper.jsx`, gate the upload button's `canEdit` with `character.can_edit || (!character.is_pc && character.is_player)` (mirroring the existing `character.is_pc` guard already used for the slain buttons) instead of `character.can_edit` alone. On the index page, thread the page-level `isPlayer` state (from #416's `GameNpcsController` change) into `CharacterCardHelper`'s upload-button gating the same way `canEdit` already flows in.
- Update `docs/agents/access-control.md` (the NPC row of the photo-upload-init table/summary, and the finalize-gating prose) to document the new NPC "or any player of that game" clause, leaving the PC rows unchanged.

## Benefits
Lets players contribute NPC portraits during a session without needing the GM to do it, consistent with the other minor NPC edits already being opened up to players in #416.

---

Tags: :shipit:
