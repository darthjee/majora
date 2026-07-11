# Backend Plan: Allow players to perform NPC photo upload

Main plan: [plan.md](plan.md)

## Shared contracts

Must produce: the NPC photo-upload init endpoint and the upload-finalize endpoint both accept
a player of the game (via `NpcPlayerEditPermission`, added by #416) in addition to the existing
`CharacterEditPermission` (GM/superuser), for NPCs only — PC photo upload is unchanged at both
checkpoints. No response-shape change on either endpoint.

**Prerequisite:** issue #416 must already be implemented — `NpcPlayerEditPermission` must
already exist in `source/games/permissions.py` before this plan's steps make sense.

## Implementation Steps

### Step 1 — NPC-only permission at the upload-init endpoint

In `source/games/views/characters/_photo_upload.py`, `character_photo_upload(request, game,
game_slug, character_id, npc)` currently always does
`CharacterEditPermission.check(request, character)`. Change this to pick the permission class
based on the existing `npc` parameter: `NpcPlayerEditPermission` when `npc` is `True`,
`CharacterEditPermission` when `npc` is `False`. `game_npc_photo_upload.py` already calls this
shared function with `npc=True`; `game_pc_photo_upload.py` calls it with `npc=False` — no
changes needed to either thin view wrapper, only to the shared function's permission choice.

### Step 2 — NPC-only permission at the upload-finalize endpoint

In `source/games/views/upload_finalize.py`, `_check_permission(request, upload)` currently does:

```python
if isinstance(content_object, CharacterPhoto):
    return CharacterEditPermission.check(request, content_object.character)
```

Change the `CharacterPhoto` branch to pick the permission class based on
`content_object.character.npc`: `NpcPlayerEditPermission` when `True`, `CharacterEditPermission`
when `False` (PC photos, unchanged). The `TreasurePhoto`/game-cover branches are untouched.

### Step 3 — Tests

- `source/games/tests/views/characters/` (wherever the NPC/PC photo-upload-init tests live):
  add a case where a player of the game (linked via `Player.games`, built directly in test
  setup — same caveat as #416, `Player.games` isn't populated by any production path yet) gets
  `201` from the NPC init endpoint, and confirm the PC init endpoint still `403`s that same
  user (i.e. the PC path is provably unaffected, not just untested).
- `source/games/tests/views/test_upload_finalize.py` (or wherever finalize is tested): add the
  analogous case at finalize — a player of the game can finalize an NPC `CharacterPhoto`
  upload they initiated, while the same user still gets `403` finalizing a PC `CharacterPhoto`
  upload.
- Keep all existing GM/superuser/owner/unauthenticated cases passing unchanged at both
  endpoints.

### Step 4 — Update docs

`docs/agents/access-control.md`:
- The photo-upload-init table (~line 176-179) and summary table (~line 123): update only the
  NPC row to read "Player of that character, any GameMaster of that game, any player of that
  game, or superuser" (or similarly worded) — leave the PC row exactly as it is.
- The finalize-gating prose (~lines 144-147): note the same NPC-only broadening, referencing
  `NpcPlayerEditPermission`.
- `docs/agents/product.md`: extend the Editing Rules branch #416 added (player-of-game may
  toggle NPC `public_slain`) to also cover NPC photo upload, rather than introducing a new rule
  — this is the same authorization concept applied to a second capability, not a new one.

## Files to Change

- `source/games/views/characters/_photo_upload.py` — NPC-vs-PC permission branch.
- `source/games/views/upload_finalize.py` — NPC-vs-PC permission branch in `_check_permission`.
- Photo-upload-init and upload-finalize test files — new player-of-game cases (NPC allowed, PC
  still forbidden).
- `docs/agents/access-control.md`, `docs/agents/product.md` — updated per Step 4.

## CI Checks

- `source`: `poetry run pytest games/tests/views/characters/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`)
- `source`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/characters/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`, covers `upload_finalize`)

## Notes

- Do not touch `CharacterEditPermission` itself, or any PC-facing behavior — this issue is
  additive and NPC-only, exactly like #416.
- Reuse `NpcPlayerEditPermission` as-is; do not fork a second near-identical permission class
  for photo upload.
