# Backend Plan: Staff should have access to NPC photo upload

Main plan: [plan.md](plan.md)

## Shared contracts

None — this is a self-contained permission-dispatch fix; no field or endpoint shape changes.

## Implementation Steps

### Step 1 — Stop branching on `npc` at the photo-upload init endpoint

In `backend/games/views/game/_photo_upload.py:16`, replace:

```python
permission_class = NpcPlayerEditPermission if npc else CharacterPhotoUploadPermission
```

with an unconditional `CharacterPhotoUploadPermission`. Drop the now-unused
`NpcPlayerEditPermission` import (line 7) if nothing else in the file needs it.

`CharacterPhotoUploadPermission._is_allowed` (`backend/games/permissions.py:88-92`) already grants
`user.is_staff or is_player_of_game or character.can_be_edited_by(user)` for *any* character — it
was never actually PC-specific, only used for PCs so far. Do not touch `NpcPlayerEditPermission`
itself: it's reused verbatim by `backend/games/views/game/npcs/_npc_player_update.py` (the "toggle
slain" endpoint) and must keep its current, narrower behavior there.

### Step 2 — Stop branching on `character.npc` at the finalize endpoint

In `backend/games/views/upload_finalize.py:81-83`, replace:

```python
permission_class = (
    NpcPlayerEditPermission if character.npc else CharacterPhotoUploadPermission
)
```

with an unconditional `CharacterPhotoUploadPermission`. Drop the `NpcPlayerEditPermission` import
(line 15) if it becomes unused in this file.

### Step 3 — Update access-control docs

- `docs/agents/access-control/upload.md`: the "Character photo upload init endpoints" table
  currently lists the NPC route as **NpcPlayerEdit**; change it to **CharacterPhotoUpload**, matching
  the PC row. Update the finalize-side prose ("Gated by CharacterPhotoUpload for a PC, or
  NpcPlayerEdit for an NPC...") to say both PC and NPC now use **CharacterPhotoUpload** (issue #713
  aligned the NPC branch with the same rule already used for PCs, issues #619/#668).
- `docs/agents/access-control/common-rules.md`: update the **CharacterPhotoUpload** row's
  description to drop the "PC photo-upload flow only" qualifier now that it also covers NPCs (both
  the init route and the finalize route's NPC branch, issue #713).

### Step 4 — Tests

- `backend/games/tests/views/game/npcs/detail/game_npc_photo_upload_test.py`: add a
  `test_staff_user_returns_201` case mirroring the PC test of the same name in
  `backend/games/tests/views/game/pcs/detail/game_pc_photo_upload_test.py:169-172` — an
  `is_staff=True` user unrelated to the game can initiate an NPC photo upload.
- `backend/games/tests/views/upload_finalize_test.py`: check the existing PC staff-finalize test
  (added by #668) and add the equivalent case for an NPC `CharacterPhoto` upload, asserting a staff
  user unrelated to the game can finalize it.
- No changes needed to `backend/games/tests/views/game/npcs/_npc_player_update_test.py` (or
  equivalent) — the "toggle slain" endpoint's permission is untouched.

## Files to Change

- `backend/games/views/game/_photo_upload.py` — always use `CharacterPhotoUploadPermission` for the
  init endpoint, drop the `npc` branch.
- `backend/games/views/upload_finalize.py` — always use `CharacterPhotoUploadPermission` for the
  `CharacterPhoto` branch of `_check_permission`, drop the `character.npc` branch.
- `docs/agents/access-control/upload.md` — update the NPC init route and finalize prose.
- `docs/agents/access-control/common-rules.md` — update `CharacterPhotoUpload`'s description.
- `backend/games/tests/views/game/npcs/detail/game_npc_photo_upload_test.py` — add staff-access test.
- `backend/games/tests/views/upload_finalize_test.py` — add NPC staff-finalize test.

## CI Checks

- `backend/games/tests/views/game/`: `poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`) — covers `game_npc_photo_upload_test.py`.
- `backend/games/tests/views/` (excluding `views/game/`): `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`) — covers `upload_finalize_test.py`.

## Notes

- `permissions.py` itself is unchanged — no need to touch `permissions_test.py`.
- Double-check no other call site branches on `npc`/`character.npc` specifically to pick between
  `NpcPlayerEditPermission` and `CharacterPhotoUploadPermission` (only the two call sites above do,
  per a repo-wide grep during planning).
