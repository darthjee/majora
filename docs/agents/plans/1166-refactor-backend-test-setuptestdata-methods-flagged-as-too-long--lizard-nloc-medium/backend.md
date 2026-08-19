# Backend Plan: Refactor backend test setUpTestData methods flagged as too long (Lizard nloc-medium)

Main plan: [plan.md](plan.md)

## Overview

Extract per-fixture helper methods out of 8 `setUpTestData` methods in `backend/uploads/tests/` (7 flagged by Lizard's 50-NLOC limit, plus `views_game_item_test.py` opportunistically), and introduce a new shared `TestCase` mixin — `UploadFinalizeFixtureMixin` in `backend/uploads/tests/fixtures.py` — for the actor/upload boilerplate duplicated across those 8 files. Pure structural refactor: no production code changes, no fixture-data or assertion changes.

## Implementation Steps

### Step 1 — Create the shared fixture mixin

Create `backend/uploads/tests/fixtures.py`, following the precedent of `backend/games/tests/behaviors.py` (mixin classes, module docstring explaining why the helpers exist, one-line method docstrings). Define `UploadFinalizeFixtureMixin` with these `@classmethod` helpers:

- `_create_dm(cls, game, username='dm_user')` → `(dm_user, dm_token)`. Creates the DM user via `UserFactory(username=username, password='secret-password')`, a `PlayerFactory(game=game, user=dm_user, is_dm=True)`, and a `Token`.
- `_create_player_of_game(cls, game, username='player_of_game', name='Pippin')` → `(player_of_game_user, player_of_game_token)`. Same shape, `is_dm` omitted.
- `_create_staff_user(cls, username='staff_user')` → `(staff_user, staff_token)`. `UserFactory(..., is_staff=True)` + `Token`.
- `_create_upload_and_photo(cls, photo_model, user, file_path, **photo_kwargs)` → `(upload, photo)`. `Upload.objects.create(user=user, file_path=file_path)` → `photo_model.objects.create(path=file_path, **photo_kwargs)` → `upload.content_object = photo; upload.save()`.

**Important — preserve exact fixture data**: several files use non-default usernames (e.g. `views_faction_test.py` uses `dm_user_faction`, `player_of_game_faction`, `staff_user_faction`, and a different `game_slug`). The `username`/`name` parameters above exist specifically so every migrated file can pass its *current* literal values through — the created objects' field values must stay byte-for-byte identical to what each file creates today. Diff each file's post-refactor `setUpTestData` against its current version field-by-field before considering it done.

Not every file uses every helper — `views_character_item_test.py` (and check each other file individually) does not create a `player_of_game` actor at all; only migrate the actors a given file actually has today. Do not add or remove actors as a side effect of this refactor.

### Step 2 — Migrate the 7 flagged files

For each of the 7 files below, make the test class inherit `(UploadFinalizeFixtureMixin, TestCase)` and replace the inline actor-setup blocks with calls to the mixin's helpers. Then extract the remaining per-subject fixture creation (the specific `<Model>Photo`/`Upload` pairs unique to that file's subject) into file-local `_create_<subject>()` helper methods, built on top of `_create_upload_and_photo`:

- `views_character_item_test.py` (69 lines) — actors: dm, owner/player (local, not the shared `player_of_game` helper), staff. Extract `_create_character_item()` and the three upload/photo pairs (owner, dm, staff) as local helpers.
- `views_character_test.py` (80 lines) — actors: dm, owner/player (local), player_of_game (shared), staff. Extract `_create_character()` (PC) and `_create_npc()`, plus their upload/photo pairs.
- `views_faction_test.py` (56 lines) — actors: dm, player_of_game (shared, non-default usernames — see Step 1 note), staff. Extract `_create_faction()` and its upload/photo pairs.
- `views_game_common_item_test.py` (62 lines) — actors: dm, player_of_game (shared), staff. Extract `_create_game_common_item()` and its upload/photo pairs.
- `views_game_document_file_photo_test.py` (113 lines) — actors: dm, player_of_game (shared), staff. This file is the outlier described in the issue: it calls `_create_upload_and_photo` twice per `GameDocumentFile` (once for the file itself with `upload_type=Upload.UPLOAD_TYPE_FILE`, once for the photo), then locally sets `document_file.photo = photo` and saves — that composition stays file-local, not folded into the shared helper. Extract a local `_create_game_document_file(...)` helper encapsulating this composition.
- `views_game_document_test.py` (52 lines) — actors: dm, player_of_game (shared), staff. Extract `_create_game_document()`-equivalent local helper(s) for its photo pairs.
- `views_game_possession_test.py` (60 lines) — actors: dm, player_of_game (shared), staff. Extract `_create_game_possession()` and its upload/photo pairs.

Read each file's current `setUpTestData` in full before extracting — the summaries above are a starting map, not a substitute for reading the exact fixtures being preserved.

### Step 3 — Migrate the opportunistic 8th file

`views_game_item_test.py` is under the 50-NLOC limit already but shares the same actor shape (dm, player_of_game, staff). Migrate it to `UploadFinalizeFixtureMixin` too, extracting a local `_create_game_item()` helper for its upload/photo pairs, for consistency with the other 7 — do not leave it as the only holdout using inline actor setup.

### Step 4 — Verify

1. `cd backend && poetry run pytest --cov` — run at minimum the 8 migrated files' test modules; every existing assertion must still pass unmodified (pure structural refactor, no behavior change).
2. `poetry run ruff check .`
3. Run `codacy_cli_analyze` (Codacy MCP, Lizard tool) locally against the 8 changed files plus the new `fixtures.py` to confirm every method is under the 50-NLOC limit before opening the PR.

## Files to Change

- `backend/uploads/tests/fixtures.py` — **new file**: `UploadFinalizeFixtureMixin` with `_create_dm`, `_create_player_of_game`, `_create_staff_user`, `_create_upload_and_photo`.
- `backend/uploads/tests/views_character_item_test.py` — extract local per-subject helpers, adopt mixin for dm/staff actors.
- `backend/uploads/tests/views_character_test.py` — extract local per-subject helpers, adopt mixin for dm/player_of_game/staff actors.
- `backend/uploads/tests/views_faction_test.py` — extract local per-subject helpers, adopt mixin (non-default usernames/slug preserved).
- `backend/uploads/tests/views_game_common_item_test.py` — extract local per-subject helpers, adopt mixin.
- `backend/uploads/tests/views_game_document_file_photo_test.py` — extract local per-subject helpers (with the file/photo composition kept local), adopt mixin.
- `backend/uploads/tests/views_game_document_test.py` — extract local per-subject helpers, adopt mixin.
- `backend/uploads/tests/views_game_possession_test.py` — extract local per-subject helpers, adopt mixin.
- `backend/uploads/tests/views_game_item_test.py` — opportunistic migration to the mixin, extract local per-subject helper.

No production code (`backend/games`, `backend/uploads` app code) is touched.

## CI Checks

- `backend/`: `cd backend && poetry run pytest --cov` and `poetry run ruff check .` (CI jobs: `pytest_views_characters`, `pytest_views_rest`, `pytest_all`, `checks`)

## Notes

- This is a test-only structural refactor — fixture data and assertions must remain byte-for-byte identical across all 8 files; the only observable diff should be in how the fixtures are constructed, not what they produce.
- No local CI equivalent exists for the Lizard/Codacy NLOC check in `contributing.md`'s table; use the Codacy MCP's `codacy_cli_analyze` locally as a substitute before opening the PR (see Step 4).
- `views_character_item_test.py` and `views_character_test.py` both build an `owner`/`player` actor pair that isn't shared by any other file (it's specific to owning a PC `Character`) — keep that local, do not try to force it into the shared mixin.
