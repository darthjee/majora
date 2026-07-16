# Backend Plan: Player should be able to edit NPC

Main plan: [plan.md](plan.md)

## Shared contracts

`NpcPlayerUpdateSerializer` (`backend/games/serializers/characters/npcs/npc_player_update.py`)
gains two more writable, unaliased fields: `name` and `role` (plain pass-through, same as on
`CharacterUpdateSerializer` — no `source=` remapping needed, unlike `allegiance`/`slain`).
`money` stays excluded. No other endpoint, permission class, or serializer changes are needed —
`NpcPlayerEditPermission` (`backend/games/permissions.py`) already allows any player of the
game (or a full editor) through, unchanged.

## Implementation Steps

### Step 1 — Widen `NpcPlayerUpdateSerializer`'s field set

File: `backend/games/serializers/characters/npcs/npc_player_update.py`

- Add `'name'` and `'role'` to `Meta.fields` (currently
  `['public_description', 'allegiance', 'slain', 'links']`).
- No new field declarations needed for `name`/`role` (they're plain `Character` model fields
  with no wire-name aliasing, unlike `allegiance`/`slain` which map to `public_allegiance`/
  `public_slain`) — `ModelSerializer` will generate them like it does on
  `CharacterUpdateSerializer` (`backend/games/serializers/characters/character_update.py`).
  Match that serializer's field definitions/`extra_kwargs` for `name`/`role` if it declares
  any (e.g. blank handling), so partial-editor and full-editor validation stay consistent.
- Update the class docstring — it currently says `name`, `role`, `money` "stay `full.json`-only";
  narrow that claim to `money` (and `private_description`, which is unaffected by this issue).

### Step 2 — Tests

File: `backend/games/tests/serializers/characters/npcs/npc_player_update_test.py`
- Add cases: a payload with `name`/`role` validates and updates the character; confirm `money`
  in the payload is still ignored/rejected the same way it is today (whatever the existing
  behavior is for a field outside `Meta.fields` — check the existing test file for the pattern
  already used for a currently-excluded field, if any).

File: `backend/games/tests/views/game/npcs/game_npc_detail_test.py`
- Add a case: a player of the game (not a DM/superuser) `PATCH`es the partial endpoint with
  `name`/`role` and gets a `200` with the character's `name`/`role` updated. Follow the
  existing test patterns in this file for how a "player" vs "DM" requester is set up.

## Files to Change

- `backend/games/serializers/characters/npcs/npc_player_update.py` — add `name`, `role` to the
  writable field set; update docstring.
- `backend/games/tests/serializers/characters/npcs/npc_player_update_test.py` — new
  name/role coverage.
- `backend/games/tests/views/game/npcs/game_npc_detail_test.py` — new player-PATCH-with-name/
  role coverage.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job covering `games/tests/views/game/`, which includes the npc detail view test)
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job covering everything outside `games/tests/views/`, which includes the serializer test)
- `backend`: `poetry run flake8` or equivalent — see the "Check python Lint" job in `.circleci/config.yml` for the exact command if a manual run is needed.

## Notes

- Double-check whether `role` is allowed blank/empty on `Character` (mirror whatever
  `CharacterUpdateSerializer` already assumes) — the partial serializer should not introduce a
  stricter or looser validation rule than the full one for the same field.
- Out of scope, found during investigation but not part of this issue: a player of the game who
  is *not* the owner of a given PC can still reach the PC edit page today (the frontend's
  redirect check only requires `is_player`, not ownership) and would get a `403` on submit
  since `is_player` alone doesn't satisfy `CharacterEditPermission` for a PC. Pre-existing
  behavior from #445, unrelated to this issue's NPC-only scope — flagging in case it's worth a
  follow-up issue.
