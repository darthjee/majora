# Plan: Staff should be able to upload PCs photos

Issue: [668-staff-should-be-able-to--upload-pcs-photos.md](../issues/668-staff-should-be-able-to--upload-pcs-photos.md)

## Overview
The PC photo upload flow has two backend-authorized steps that are supposed to share the same permission rule but don't. The init endpoint (`POST /games/:game_slug/pcs/:id/photo_upload.json`) already allows staff and any player of the game via `CharacterPhotoUploadPermission`. The finalize endpoint (`PATCH /uploads/:id.json`, invoked twice internally by `proxy/extension/lib/handlers/PhotoUploadHandler.php` for `POST /uploads/:upload_id/submit.json`) instead uses the stricter `CharacterEditPermission` for PCs, which has no staff or "any player" bypass. This is a single-line permission-class swap in `upload_finalize.py`, plus updating/adding backend tests. No frontend or proxy changes are needed — the proxy handler forwards auth headers as-is and does not implement any authorization logic itself.

## Context
- `backend/games/permissions.py:68-91` — `CharacterPhotoUploadPermission._is_allowed`: `user.is_staff or is_player_of_game or character.can_be_edited_by(user)`. Already used by the init endpoint for PCs.
- `backend/games/views/upload_finalize.py:73-82` — `_check_permission` currently does `permission_class = NpcPlayerEditPermission if character.npc else CharacterEditPermission` for `CharacterPhoto` content objects. The PC (`else`) branch is the bug: `CharacterEditPermission` falls back to `Character.can_be_edited_by(user)` only (superuser or owner/DM), with no staff/player-of-game bypass.
- The NPC branch is already correct and untouched by this fix.
- `backend/games/tests/views/upload_finalize_test.py:384-393` has `test_player_of_game_returns_403_for_pc_upload`, which currently asserts the buggy 403 as the expected outcome for a non-owner player. This needs to flip to asserting success, and a staff-user case should be added, mirroring the existing `test_staff_user_returns_201` pattern in `backend/games/tests/views/game/pcs/detail/game_pc_photo_upload_test.py`.

## Implementation Steps

### Step 1 — Fix the permission class for PCs in `upload_finalize`
In `backend/games/views/upload_finalize.py`, change `_check_permission`'s `CharacterPhoto` branch so the PC case uses `CharacterPhotoUploadPermission` instead of `CharacterEditPermission`:

```python
permission_class = NpcPlayerEditPermission if character.npc else CharacterPhotoUploadPermission
```

Update the import at the top of the file accordingly (swap `CharacterEditPermission` for `CharacterPhotoUploadPermission` if `CharacterEditPermission` is no longer used elsewhere in this file — verify before removing the import).

### Step 2 — Update/add tests in `upload_finalize_test.py`
- Update `test_player_of_game_returns_403_for_pc_upload` (lines ~384-393): a player of the game who is not the PC's owner should now get a successful response (200), not 403, for both the `uploading` and `uploaded` status transitions. Rename the test to reflect the corrected behavior (e.g. `test_player_of_game_returns_200_for_pc_upload`).
- Add a new test asserting a staff user (not owner, not necessarily a player of the game) can successfully finalize a PC upload — mirroring `test_staff_user_returns_201` in `game_pc_photo_upload_test.py`, but exercising `upload_finalize` for both status transitions (`uploading` and `uploaded`), analogous to the existing `test_uploading_status_returns_200_for_npc_upload_by_player_of_game` / `test_uploaded_status_sets_npc_photo_ready_for_player_of_game` pair.
- Leave NPC tests and PC owner/DM/superuser tests unchanged — they already pass and are unaffected by this fix.

## Files to Change
- `backend/games/views/upload_finalize.py` — swap `CharacterEditPermission` for `CharacterPhotoUploadPermission` in the PC branch of `_check_permission`; adjust imports.
- `backend/games/tests/views/upload_finalize_test.py` — update the existing player-of-game PC test to expect success instead of 403; add a staff-user PC finalize test.

## CI Checks
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`) — covers `upload_finalize_test.py`.
- `backend`: `poetry run ruff check .` (CI job: `checks`) — lint.

## Notes
- No proxy or frontend changes are needed; `PhotoUploadHandler.php` only forwards headers and does not implement authorization logic.
- Scope is deliberately narrow: only the PC branch of `upload_finalize`'s `_check_permission` changes. The NPC branch already grants the equivalent broader access via `NpcPlayerEditPermission` and stays as-is.
