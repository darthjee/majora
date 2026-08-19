# Issue: Refactor backend test setUpTestData methods flagged as too long (Lizard nloc-medium)

## Description

Sub-issue of #1152. Codacy's `Lizard` complexity analyzer flags 7 `setUpTestData` methods in `backend/uploads/tests/` as exceeding the 50-NLOC-per-method limit.

## Problem

These `setUpTestData` methods build several test fixtures inline in one long method, making them hard to review and reuse across test classes.

## Expected Behavior

Each method below drops back under its 50-NLOC limit by extracting per-fixture helper methods (the natural split for `setUpTestData`), following the project's existing pattern of splitting test files and extracting shared setup helpers — per the Definition of Done strengthened in #1152.

## Solution

For each occurrence, extract cohesive fixture-creation chunks into well-named helper methods (e.g. `_create_character()`, `_create_faction()`), reusing shared helpers across files where the same fixture shape repeats.

### Occurrences (7)

- `backend/uploads/tests/views_character_item_test.py`
  - line 23: `setUpTestData` has 69 lines (limit 50)
- `backend/uploads/tests/views_character_test.py`
  - line 17: `setUpTestData` has 80 lines (limit 50)
- `backend/uploads/tests/views_faction_test.py`
  - line 17: `setUpTestData` has 56 lines (limit 50)
- `backend/uploads/tests/views_game_common_item_test.py`
  - line 22: `setUpTestData` has 62 lines (limit 50)
- `backend/uploads/tests/views_game_document_file_photo_test.py`
  - line 17: `setUpTestData` has 113 lines (limit 50)
- `backend/uploads/tests/views_game_document_test.py`
  - line 17: `setUpTestData` has 52 lines (limit 50)
- `backend/uploads/tests/views_game_possession_test.py`
  - line 22: `setUpTestData` has 60 lines (limit 50)

### Scope

- **Files touched**: the 7 flagged files above, **plus** `backend/uploads/tests/views_game_item_test.py` opportunistically — it shares the exact same actor-setup shape (game + DM + a second "player of game" + staff user, each with a `Token`) but sits under the 50-NLOC limit already, so it wasn't flagged by Lizard. It still benefits from the shared helper introduced below and should be migrated to it in this same PR.
- **No other `backend/uploads/tests/*.py` files** are in scope, even if they share fragments of the same shape — this issue's diff stays limited to the 7 flagged files + the one opportunistic file above. Broader migration is a separate future cleanup.
- **Test-only change**: no production code (`backend/games`, `backend/uploads` app code) is touched. Fixture data created and all assertions must remain byte-for-byte identical — this is a structural refactor, not a behavior change.

### Shared cross-file helper

Beyond per-file extraction, this issue also introduces a **shared `TestCase` mixin** (new module under `backend/uploads/tests/`) reused by all 8 files above, covering the boilerplate that's duplicated *across* files:

- Actor setup: `game` + `dm_user`/`dm_token` + `player_of_game`/`player_of_game_token` + `staff_user`/`staff_token`.
- A low-level generic fixture helper, `_create_upload_and_photo(photo_model, user, file_path, **photo_kwargs)`, returning `(upload, photo)` for the common case: `Upload.objects.create(...)` → `<Model>Photo.objects.create(...)` → `upload.content_object = photo` → `upload.save()`. Used directly by the 7 uniform files.
- `views_game_document_file_photo_test.py` is a partial exception: it uses the same low-level helper twice (once per `Upload`) but composes the result locally, since it additionally links the photo onto its parent `GameDocumentFile.photo` (not just `Upload.content_object`) and sets `upload_type=Upload.UPLOAD_TYPE_FILE` on one of the two uploads — that extra composition logic stays file-local rather than being folded into the shared helper.

### Naming convention

Follows the existing precedent in `backend/games/tests/behaviors.py` (mixin classes, one per concern, suffixed `Mixin`) and `backend/games/tests/views/support.py` (plain module-level function helpers) — both plain filenames with no leading underscore and no `_test.py` suffix, so pytest's `python_files = ["*_test.py"]` config (`backend/pyproject.toml`) doesn't collect them as test modules:

| What | Name |
| --- | --- |
| New module | `backend/uploads/tests/fixtures.py` (not `factories.py` — that name is already taken by `games/tests/factories/` for factory_boy factories; this is `TestCase`-mixin fixture setup, a different concept) |
| Mixin class | `UploadFinalizeFixtureMixin` |
| Actor-setup helpers | `_create_dm(cls, game)`, `_create_player_of_game(cls, game, name='Pippin')`, `_create_staff_user(cls)` — each a `@classmethod` returning `(user, token)`, called from `setUpTestData` and assigned to `cls.dm_user`/`cls.dm_token` etc., matching the existing attribute names |
| Low-level generic helper | `_create_upload_and_photo(cls, photo_model, user, file_path, **photo_kwargs)` → `(upload, photo)` |
| Per-file, file-local per-subject helpers | `_create_<subject>()` (e.g. `_create_character()`, `_create_npc()`, `_create_faction()`, `_create_game_item()`) — matches this issue's original examples |

### Testing Strategy

Two things need verifying: behavior is unchanged, and the NLOC violations are actually resolved.

1. **Behavior unchanged**: `cd backend && poetry run pytest --cov` covering the 8 affected files (the 7 flagged files + `views_game_item_test.py`) — the extraction is pure structure, no fixture-data changes, so every existing assertion must still pass unmodified. Plus `poetry run ruff check .`, per the standard backend CI mapping in `contributing.md`.
2. **NLOC actually fixed**: `contributing.md`'s CI table lists no local equivalent for the Lizard/Codacy check (same gap as the markdown-formatting check) — but this repo now has the Codacy MCP server configured, so run `codacy_cli_analyze` locally against the 8 changed files to confirm every `setUpTestData` (and the new shared mixin's methods) is under the 50-NLOC limit before opening the PR, rather than relying solely on Codacy's PR check to catch it.

## Benefits

Improved readability and reusability of test fixtures; passes the Codacy Lizard check.
