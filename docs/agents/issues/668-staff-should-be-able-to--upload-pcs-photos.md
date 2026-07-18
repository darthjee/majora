# Issue: Staff should be able to upload PCs photos

## Description
The PC photo upload flow is a two-step process:

1. `POST /games/:game_slug/pcs/:id/photo_upload.json` — initializes the upload and returns an `upload_id`/`token`.
2. `POST /uploads/:upload_id/submit.json` — the client-facing route handled by `proxy/extension/lib/handlers/PhotoUploadHandler.php`, which internally issues two `PATCH /uploads/:upload_id.json` calls to the backend (`status=uploading`, then `status=uploaded`) to advance the upload state machine.

## Problem
Step 1 uses `CharacterPhotoUploadPermission` (`backend/games/permissions.py:68-91`), whose `_is_allowed` is `user.is_staff or is_player_of_game or character.can_be_edited_by(user)` — it explicitly allows staff and any player of the game (added for issue #619/#625).

Step 2, handled by `upload_finalize` (`backend/games/views/upload_finalize.py:73-81`), resolves permission differently:

```python
permission_class = NpcPlayerEditPermission if character.npc else CharacterEditPermission
```

For PCs (`character.npc == False`) this picks `CharacterEditPermission`, a bare `_EditPermission` with no override — it falls back to `Character.can_be_edited_by(user)` only (superuser or owner/DM), with **no staff bypass and no "any player of the game" bypass**. NPCs are unaffected: `NpcPlayerEditPermission` already grants the broader access on both steps.

As a result, a user who is `staff` and a player of the game, but not the owner of the PC, passes step 1 (upload initializes successfully, confirmed by the existing test `test_staff_user_returns_201` in `game_pc_photo_upload_test.py`) but gets a 403 from `PATCH /uploads/:id.json` on step 2 — breaking the upload partway through, after the file has already been accepted client-side.

Note `backend/games/tests/views/upload_finalize_test.py` currently has a test, `test_player_of_game_returns_403_for_pc_upload`, that documents this strict-owner behavior as the *expected* outcome for PCs — it encodes the bug and will need to change alongside the fix.

## Expected Behavior
A user who is staff, or any player of the game, should be able to complete the full PC photo upload flow (both steps), consistent with who is allowed to start it in step 1.

## Solution
In `backend/games/views/upload_finalize.py`, `_check_permission` should use `CharacterPhotoUploadPermission` for PCs (instead of `CharacterEditPermission`), mirroring how the NPC branch already uses `NpcPlayerEditPermission`, so both steps of the flow share the same authorization rule:

```python
permission_class = NpcPlayerEditPermission if character.npc else CharacterPhotoUploadPermission
```

Update `test_player_of_game_returns_403_for_pc_upload` in `upload_finalize_test.py` (it currently asserts the buggy 403), and add a staff-user test for the PC finalize path mirroring `test_staff_user_returns_201` from `game_pc_photo_upload_test.py`.

## Benefits
- Fixes the broken upload for staff/non-owner players, who currently see the upload fail partway through with a 403.
- Makes the two steps of the PC photo upload flow share one consistent authorization rule, avoiding future occurrences of the same step-1/step-2 mismatch.
