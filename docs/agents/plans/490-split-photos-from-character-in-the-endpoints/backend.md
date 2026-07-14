# Backend Plan: Split photos from character in the endpoints

Main plan: [plan.md](plan.md)

## Shared contracts

- After this change, `photos` no longer appears in the JSON body of the PC/NPC show and full endpoints. Every other field (including `profile_photo_path`, `profile_photo_id`) is unchanged.
- No endpoint work is needed: both `GET /games/:game_slug/pcs/:id/photos.json` and `GET /games/:game_slug/npcs/:id/photos.json` already exist (`backend/games/views/characters/game_pc_photos.py`, `backend/games/views/characters/game_npc_photos.py`, both backed by `character_photos()` in `backend/games/views/characters/_photos.py` and `CharacterPhotoSerializer`) and keep working exactly as before — the frontend agent will start calling them from the character load flow.

## Implementation Steps

### Step 1 — Remove `photos` from `CharacterDetailSerializer`

In `backend/games/serializers/character_detail.py`:
- Remove the `photos = CharacterPhotoSerializer(many=True, read_only=True)` field declaration (line 13).
- Remove `'photos'` from `Meta.fields` (line 37).
- Remove the now-unused `from games.serializers.character_photo import CharacterPhotoSerializer` import (line 7).

`CharacterFullSerializer` (`backend/games/serializers/character_full.py`) extends `CharacterDetailSerializer` and builds its `Meta.fields` as `CharacterDetailSerializer.Meta.fields + [...]` without adding `photos` itself, so it automatically stops exposing `photos` too — no change needed in that file.

`CharacterListSerializer` and `CharacterFullListSerializer` never included `photos` — no change needed there.

### Step 2 — Update serializer tests

- `backend/games/tests/serializers/character_detail_test.py`: remove `test_serializes_empty_photos` (lines 79-82) and `test_serializes_nested_photos` (lines 84-96), which assert on the now-removed `photos` field. Leave the `CharacterPhoto` import and factory usage in place — still needed by the `profile_photo_path`/`profile_photo_id` tests later in the file.
- `backend/games/tests/serializers/character_full_test.py`: remove `'photos'` from the `expected_fields` list around line 50.

Search both files (and any other `games/tests/serializers/*character*` or `games/tests/views/**pc*`/`**npc*` test files) for any other assertion on a `photos` key in a show/full response body and remove it — the two files above are the ones already confirmed to reference it, but double-check nothing else was missed.

## Files to Change

- `backend/games/serializers/character_detail.py` — remove the `photos` field and its import.
- `backend/games/tests/serializers/character_detail_test.py` — remove the two `photos`-specific tests.
- `backend/games/tests/serializers/character_full_test.py` — trim `'photos'` from the expected fields list.

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`, covers `games/tests/serializers/`)

## Notes

- Do not touch `profile_photo_path` or `profile_photo_id` — the issue explicitly calls these out as unchanged.
- Do not add or modify anything under `backend/games/views/characters/` — both photos endpoints already exist and already behave correctly for PC and NPC.
