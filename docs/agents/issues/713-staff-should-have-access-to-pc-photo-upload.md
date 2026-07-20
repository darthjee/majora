# Issue: Staff should have access to NPC photo upload

## Description
Staff (regular, non-superuser `is_staff` accounts) currently cannot upload photos for NPCs, even though the equivalent action for PCs was already unlocked for staff by #619 and #668. This closes that parity gap by extending the same staff bypass to NPCs.

## Problem
- `NpcPlayerEditPermission` (`backend/games/permissions.py:54-70`) — used by both the NPC photo-upload init endpoint (via `backend/games/views/game/_photo_upload.py`, reached from `backend/games/views/game/npcs/detail/game_npc_photo_upload.py`) and the NPC branch of `upload_finalize.py`s `_check_permission` (`backend/games/views/upload_finalize.py:74-84`) — only grants access to players of the game or users covered by `can_be_edited_by` (superuser or editor/DM). A regular staff account gets a 403 on both endpoints.
- On the frontend, `CharacterAvatarHelper.jsx:38` and `CharacterPhotos.jsx:49-50` compute Upload-photo visibility as `character.can_edit || character.is_player || (character.is_pc && character.is_staff)`. The `is_pc &&` guard means the staff bypass never applies to NPCs, so staff will not even see the Upload button on NPC pages.
- `PhotoUploadHandler.php` (`proxy/extension/lib/handlers/PhotoUploadHandler.php`) submits uploads via two `PATCH /uploads/:id.json` calls (`status=uploading`, then `status=uploaded`), which route through `upload_finalize.py` — currently blocked for staff on NPCs by the same gap.

## Expected Behavior
A staff user (any `is_staff` account, not just superusers) can:
- See and use the "Upload photo" button/modal on the NPC detail page character portrait (`/#/games/:game_slug/npcs/:id`) and on the NPC photos page (`/#/games/:game_slug/npcs/:id/photos`).
- Start the photo upload flow via the NPC photo-upload init endpoint.
- Successfully finalize the upload through `PhotoUploadHandler.php`s calls to `PATCH /uploads/:id.json`.

This mirrors the staff access PCs already have (#619, #668).

## Solution
- Add a staff bypass to `NpcPlayerEditPermission` (`backend/games/permissions.py:54-70`), mirroring the pattern already used in `CharacterPhotoUploadPermission._is_allowed` (`permissions.py:88-92`, `user.is_staff or is_player_of_game or character.can_be_edited_by(user)`). Alternatively, evaluate reusing `CharacterPhotoUploadPermission` itself for the NPC branch instead of adding a parallel bypass, since its check is not actually PC-specific.
- Update `CharacterAvatarHelper.jsx:38` and `CharacterPhotos.jsx:49-50` so the staff bypass is no longer gated by `is_pc` (e.g. drop the `character.is_pc &&` guard so `character.is_staff` alone is enough).
- Update `docs/agents/access-control/upload.md` and `docs/agents/access-control/common-rules.md` to document the new staff bypass on the NPC photo-upload permission, following the same phrasing already used for `CharacterPhotoUploadPermission`s staff bypass (#619/#668).
- Add/extend backend and frontend tests covering staff access to NPC photo upload (init + finalize) and Upload-button visibility on NPC pages.

## Benefits
Staff gain consistent, symmetric ability to manage photos for both PCs and NPCs, matching their existing PC capability and removing the inconsistency left over from #619/#668 only targeting PCs.
