# Backend Plan: Enhance Upload Photo Endpoints

Main plan: [plan.md](plan.md)

## Shared contracts

This agent must change the response shape of all three photo-upload init endpoints:

- `POST /games/<slug>/photo_upload.json` → `{"upload_id": <int>, "token": "<str>", "game_id": <int>}`.
- `POST /games/<slug>/pcs/<id>/photo_upload.json`, `POST /games/<slug>/npcs/<id>/photo_upload.json` → `{"upload_id": <int>, "token": "<str>", "character_id": <int>}`.

The frontend agent depends on these exact key names.

## Implementation Steps

### Step 1 — Update the game photo upload init response
In `source/games/views/photo_upload.py`, `photo_upload` already loads `game` via `get_object_or_404`. Change the returned `Response` from `{'id': upload.id, 'token': upload.token}` to `{'upload_id': upload.id, 'token': upload.token, 'game_id': game.id}`.

### Step 2 — Update the character photo upload init response
In `source/games/views/characters/_photo_upload.py`, `_create_upload(user, character, file_path)` already has `character` in scope. Change the returned `Response` from `{'id': upload.id, 'token': upload.token}` to `{'upload_id': upload.id, 'token': upload.token, 'character_id': character.id}`.

### Step 3 — Update backend tests
- `source/games/tests/views/photo_upload_test.py` — update the assertion(s) on the success response body to expect `upload_id` and `game_id` instead of `id`.
- `source/games/tests/views/characters/game_pc_photo_upload_test.py` and `source/games/tests/views/characters/game_npc_photo_upload_test.py` — update the assertion(s) on the success response body to expect `upload_id` and `character_id` instead of `id`.

Run tests via `docker-compose run majora_tests poetry run pytest games/tests/views/photo_upload_test.py games/tests/views/characters/game_pc_photo_upload_test.py games/tests/views/characters/game_npc_photo_upload_test.py` (or the project's standard pytest invocation through docker-compose) to confirm.

### Step 4 — Update access-control documentation
In `docs/agents/access-control.md`:
- The "Game photo upload init endpoint" section/table row for `/games/<slug>/photo_upload.json` — change the listed response fields from `id`, `token` to `upload_id`, `token`, `game_id`.
- The "Character photo upload init endpoints" section/table rows for `/games/<slug>/pcs/<id>/photo_upload.json` and `/games/<slug>/npcs/<id>/photo_upload.json` — change the listed response fields from `id`, `token` to `upload_id`, `token`, `character_id`.

## Files to Change
- `source/games/views/photo_upload.py` — rename `id` to `upload_id` in response, add `game_id`.
- `source/games/views/characters/_photo_upload.py` — rename `id` to `upload_id` in response, add `character_id`.
- `source/games/tests/views/photo_upload_test.py` — update response-shape assertions.
- `source/games/tests/views/characters/game_pc_photo_upload_test.py` — update response-shape assertions.
- `source/games/tests/views/characters/game_npc_photo_upload_test.py` — update response-shape assertions.
- `docs/agents/access-control.md` — update documented response fields for both endpoint families.

## CI Checks
- `source`: `docker-compose run majora_tests poetry run pytest games/tests/views/` (CI job: `pytest_views`)

## Notes
- No serializer exists for the response body (it's a raw dict in both views); no shared response serializer needs to be introduced — this issue only asks to rename/add keys in place.
- `Upload`/`GamePhoto`/`CharacterPhoto` models and their `id`/`token` fields are unchanged; only the view-level response dict changes.
