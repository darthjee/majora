# Plan: Split uploads views_test.py into one test file per entity

Issue: [1090-split-uploads-views-test-py-into-one-test-file-per-entity.md](../../issues/1090-split-uploads-views-test-py-into-one-test-file-per-entity.md)

## Overview

`backend/uploads/tests/views_test.py` is a single 1549-line `TestUploadFinalizeView` class
covering 93 tests across nine entities plus generic PATCH-endpoint mechanics, all sharing one
`setUpTestData`. This plan redistributes those 93 tests into ten files — nine per-entity files
plus a renamed `views_finalize_test.py` for the generic behavior — following the existing
`views_source_test.py`/`views_stl_model_test.py` convention, with no behavior change. This
issue assumes #1088 (which adds `views_faction_test.py`, `views_collection_test.py`, and a
`TestPhotoHandlersRegistry` guard test) is already merged.

## Context

Every test in the file was read and categorized by which entity's fixtures it exercises (see
Implementation Steps below for the exact list per file); the counts sum to all 93 existing
`def test_` methods, confirming full coverage with nothing left unassigned. The file mixes:
- Generic, entity-agnostic PATCH-endpoint mechanics (13 tests), all exercised via a `GamePhoto`-
  backed upload used purely as a vehicle (nonexistent upload, token mismatch/expiry, wrong user,
  already-uploaded, invalid status, unauthenticated, session-cookie auth, mismatched/unrecognized
  `upload_type`).
- Nine entities, each with their own fixture block and permission-variation tests
  (unauthenticated/unrelated-user/player-of-game/staff/DM as applicable per entity).

## Implementation Steps

### Step 1 — Create `views_game_test.py` (`GamePhoto`)

New file. Fixture: `game`, `dm_user`/`dm_token`, `upload`, `game_photo` (mirrors
`views_test.py` lines 41–56). Tests to move (6):
- `test_uploading_status_returns_200_with_file_path`
- `test_uploading_status_sets_upload_status`
- `test_uploaded_status_returns_200`
- `test_uploaded_status_sets_game_photo_ready`
- `test_uploaded_status_sets_game_photo`
- `test_uploaded_status_does_not_overwrite_existing_game_photo`

Optional (non-mandatory) naming cleanup while moving: consider renaming
`test_uploading_status_returns_200_with_file_path` to
`test_uploading_status_returns_200_for_game_upload` for consistency with the `_for_<entity>_upload`
naming pattern used by every other per-entity file — purely cosmetic, do only if it doesn't risk
losing test identity/history in a way that matters to the team.

### Step 2 — Create `views_character_test.py` (`CharacterPhoto`, PC + NPC)

New file. Fixture: `player`, `owner`/`owner_token`, `character` (PC), `player_of_game_user`/
`player_of_game`/`player_of_game_token`, `npc`, `staff_user`/`staff_token`, plus the
character/npc/pc-by-player-of-game/pc-by-staff/npc-by-staff uploads and photos (lines 58–139).
Helpers: `_valid_character_patch`, `_valid_npc_patch`. Tests to move (13):
- `test_unrelated_user_returns_403_for_character_upload`
- `test_uploading_status_returns_200_for_character_upload`
- `test_uploaded_status_sets_character_photo_ready`
- `test_uploaded_status_sets_character_photo`
- `test_uploaded_status_does_not_overwrite_existing_character_photo`
- `test_uploading_status_returns_200_for_npc_upload_by_player_of_game`
- `test_uploaded_status_sets_npc_photo_ready_for_player_of_game`
- `test_player_of_game_returns_200_for_pc_upload`
- `test_uploaded_status_sets_pc_photo_ready_for_player_of_game`
- `test_uploading_status_returns_200_for_pc_upload_by_staff`
- `test_uploaded_status_sets_pc_photo_ready_for_staff`
- `test_uploading_status_returns_200_for_npc_upload_by_staff`
- `test_uploaded_status_sets_npc_photo_ready_for_staff`

Note: there is no existing `test_unauthenticated_request_returns_401_for_character_upload` (only
the generic, `GamePhoto`-vehicle `test_unauthenticated_request_returns_401` covers 401 today).
This is a pre-existing gap, not introduced by the split — preserve as-is; do not add new tests.

### Step 3 — Create `views_treasure_test.py` (`TreasurePhoto`)

New file. Fixture: `superuser`/`superuser_token`, `treasure`, `treasure_upload`/`treasure_photo`
(lines 141–157). Helper: `_valid_treasure_patch`. Tests to move (6):
- `test_unauthenticated_request_returns_401_for_treasure_upload`
- `test_non_superuser_returns_403_for_treasure_upload`
- `test_uploading_status_returns_200_for_treasure_upload`
- `test_uploaded_status_sets_treasure_photo_ready`
- `test_uploaded_status_sets_treasure_photo`
- `test_uploaded_status_replaces_existing_treasure_photo`

### Step 4 — Create `views_game_item_test.py` (`GameItemPhoto`)

New file. Fixture: `game_item`, `item_upload`/`item_photo`,
`item_upload_by_player_of_game`/`item_photo_by_player_of_game`,
`item_upload_by_staff`/`item_photo_by_staff` (lines 159–195; needs `game`, `dm_user`/`dm_token`,
`player_of_game_user`/`token`, `staff_user`/`token`). Helper: `_valid_item_patch`. Tests to move
(10):
- `test_unauthenticated_request_returns_401_for_item_upload`
- `test_unrelated_user_returns_403_for_item_upload`
- `test_uploading_status_returns_200_for_item_upload`
- `test_uploaded_status_sets_item_photo_ready`
- `test_uploaded_status_sets_game_item_photo`
- `test_uploaded_status_replaces_existing_game_item_photo`
- `test_uploading_status_returns_200_for_item_upload_by_player_of_game`
- `test_uploaded_status_sets_item_photo_ready_for_player_of_game`
- `test_uploading_status_returns_200_for_item_upload_by_staff`
- `test_uploaded_status_sets_item_photo_ready_for_staff`

### Step 5 — Create `views_game_possession_test.py` (`GamePossessionPhoto`)

New file. Fixture: `game_possession`, `possession_upload`/`possession_photo`,
`possession_upload_by_player_of_game`/`...`, `possession_upload_by_staff`/`...` (lines
197–243). Helper: `_valid_possession_patch`. Tests to move (10):
- `test_unauthenticated_request_returns_401_for_possession_upload`
- `test_unrelated_user_returns_403_for_possession_upload`
- `test_uploading_status_returns_200_for_possession_upload`
- `test_uploaded_status_sets_possession_photo_ready`
- `test_uploaded_status_sets_game_possession_photo`
- `test_uploaded_status_replaces_existing_game_possession_photo`
- `test_uploading_status_returns_200_for_possession_upload_by_player_of_game`
- `test_uploaded_status_sets_possession_photo_ready_for_player_of_game`
- `test_uploading_status_returns_200_for_possession_upload_by_staff`
- `test_uploaded_status_sets_possession_photo_ready_for_staff`

### Step 6 — Create `views_character_item_test.py` (`CharacterItemPhoto`)

New file. Fixture: `character_item` (owned by `character`/`owner`), `character_item_upload`/
`character_item_photo`, `character_item_upload_by_dm`/`...`,
`character_item_upload_by_staff`/`...` (lines 245–299). Helper:
`_valid_character_item_patch`. Tests to move (10):
- `test_unauthenticated_request_returns_401_for_character_item_upload`
- `test_unrelated_user_returns_403_for_character_item_upload`
- `test_uploading_status_returns_200_for_character_item_upload`
- `test_uploaded_status_sets_character_item_photo_ready`
- `test_uploaded_status_sets_character_item_photo`
- `test_uploaded_status_replaces_existing_character_item_photo`
- `test_uploading_status_returns_200_for_character_item_upload_by_dm`
- `test_uploaded_status_sets_character_item_photo_ready_for_dm`
- `test_uploading_status_returns_200_for_character_item_upload_by_staff`
- `test_uploaded_status_sets_character_item_photo_ready_for_staff`

### Step 7 — Create `views_game_document_test.py` (`GameDocumentPhoto`)

New file. Fixture: `game_document`, `document_upload`/`document_photo`,
`document_upload_by_player_of_game`/`...`, `document_upload_by_staff`/`...` (lines 301–339).
Helper: `_valid_document_patch`. Tests to move (10):
- `test_unauthenticated_request_returns_401_for_document_upload`
- `test_unrelated_user_returns_403_for_document_upload`
- `test_uploading_status_returns_200_for_document_upload`
- `test_uploaded_status_sets_document_photo_ready`
- `test_uploaded_status_sets_game_document_photo`
- `test_uploaded_status_does_not_overwrite_existing_document_photo`
- `test_uploading_status_returns_200_for_document_upload_by_player_of_game`
- `test_uploaded_status_sets_document_photo_ready_for_player_of_game`
- `test_uploading_status_returns_200_for_document_upload_by_staff`
- `test_uploaded_status_sets_document_photo_ready_for_staff`

### Step 8 — Create `views_game_document_file_test.py` (`GameDocumentFile`)

New file. Fixture: `game_document` (own copy), `document_file_upload`/`document_file` with
`upload_type=Upload.UPLOAD_TYPE_FILE` (lines 341–352). Helper: `_valid_document_file_patch`.
Tests to move (5):
- `test_unauthenticated_request_returns_401_for_document_file_upload`
- `test_unrelated_user_returns_403_for_document_file_upload`
- `test_uploading_status_returns_200_for_document_file_upload`
- `test_uploaded_status_sets_document_file_ready`
- `test_wrong_upload_type_for_document_file_upload_returns_404`

### Step 9 — Create `views_game_document_file_photo_test.py` (`GameDocumentFilePhoto`)

New file. Fixture: `game_document` (own copy), plus three `GameDocumentFile` rows each linked
via `.photo` to a `GameDocumentFilePhoto` (`document_file`/`document_file_photo`,
`document_file_2`/`document_file_photo_by_player_of_game`,
`document_file_3`/`document_file_photo_by_staff`), and a standalone orphaned
`GameDocumentFilePhoto` with no linked `GameDocumentFile` (lines 354–440). Helper:
`_valid_document_file_photo_patch`. Tests to move (10):
- `test_unauthenticated_request_returns_401_for_document_file_photo_upload`
- `test_unrelated_user_returns_403_for_document_file_photo_upload`
- `test_uploading_status_returns_200_for_document_file_photo_upload`
- `test_uploaded_status_sets_document_file_photo_ready`
- `test_uploaded_status_does_not_change_document_file_photo_assignment`
- `test_uploading_status_returns_200_for_document_file_photo_upload_by_player_of_game`
- `test_uploaded_status_sets_document_file_photo_ready_for_player_of_game`
- `test_uploading_status_returns_200_for_document_file_photo_upload_by_staff`
- `test_uploaded_status_sets_document_file_photo_ready_for_staff`
- `test_orphaned_document_file_photo_upload_returns_403` — spans both models conceptually, but
  kept here since it's fundamentally about the orphaned `GameDocumentFilePhoto`'s state (no
  linked `GameDocumentFile`), per the issue's decision on this exact case.

### Step 10 — Rename `views_test.py` to `views_finalize_test.py`, keeping only generic tests

Rename the file. Slim `setUpTestData` down to just `game`, `dm_user`/`dm_token`, `upload`,
`game_photo` (the same minimal vehicle fixture as `views_game_test.py` — duplicated
independently per file, matching the existing per-file convention; do not import across test
files). Keep the `_patch`/`_valid_patch` helpers. Tests that stay (13):
- `test_nonexistent_upload_returns_403`
- `test_wrong_upload_token_returns_403`
- `test_different_user_returns_403`
- `test_expired_upload_returns_403`
- `test_already_uploaded_status_returns_403`
- `test_non_game_master_user_returns_403`
- `test_invalid_status_value_returns_400`
- `test_unauthenticated_request_returns_401`
- `test_uploading_status_via_session_cookie`
- `test_mismatched_upload_type_returns_404`
- `test_mismatched_upload_type_without_valid_token_returns_403`
- `test_mismatched_upload_type_by_non_owner_returns_403`
- `test_unrecognized_upload_type_url_segment_returns_404`

Also keep `TestPhotoHandlersRegistry` (added by issue #1088) in this file — it's registry-level,
not entity-specific, so it belongs alongside the generic tests rather than any per-entity file.
Remove the now-empty `TestUploadFinalizeView` class name entirely — the file no longer needs a
class name implying it covers every upload type; rename the class to something reflecting its
narrowed scope (e.g. `TestUploadFinalizeGeneric`).

### Step 11 — Run the full suite and confirm no coverage lost

Run `docker-compose run --rm majora_tests pytest uploads/` and confirm:
- All 93 original tests still exist (now spread across 10 files) and pass.
- No test was accidentally dropped or duplicated during the split (a quick
  `grep -c "def test_"` across the 10 new/renamed files should sum to 93, matching the count in
  the original `views_test.py` before this change).

## Files to Change

- `backend/uploads/tests/views_test.py` — renamed to `views_finalize_test.py`, slimmed to the
  13 generic tests + `TestPhotoHandlersRegistry`.
- `backend/uploads/tests/views_game_test.py` — new (6 tests).
- `backend/uploads/tests/views_character_test.py` — new (13 tests).
- `backend/uploads/tests/views_treasure_test.py` — new (6 tests).
- `backend/uploads/tests/views_game_item_test.py` — new (10 tests).
- `backend/uploads/tests/views_game_possession_test.py` — new (10 tests).
- `backend/uploads/tests/views_character_item_test.py` — new (10 tests).
- `backend/uploads/tests/views_game_document_test.py` — new (10 tests).
- `backend/uploads/tests/views_game_document_file_test.py` — new (5 tests).
- `backend/uploads/tests/views_game_document_file_photo_test.py` — new (10 tests).

## CI Checks

- `backend/`: `docker-compose run --rm majora_tests pytest uploads/` (CI job: `pytest_all`,
  which runs `poetry run pytest --ignore=games/tests/views/ ...` and covers
  `backend/uploads/tests/`)

## Notes

- Pure refactor — no production code changes, only test reorganization. No `backend/uploads/views.py`
  changes are expected as part of this issue.
- This plan assumes issue #1088 has already landed (adding `views_faction_test.py`,
  `views_collection_test.py`, and `TestPhotoHandlersRegistry` in `views_test.py`). If #1088 has
  not merged by the time this is implemented, Step 10 should still create
  `TestPhotoHandlersRegistry`'s eventual home in `views_finalize_test.py`, but the guard test
  itself won't exist yet to move — implementer should check current `main` before starting.
- Every per-entity file duplicates a small amount of user/token/game fixture setup rather than
  sharing it — this matches the existing `views_source_test.py`/`views_stl_model_test.py`
  convention (each file is fully self-contained) and is intentional, not an oversight.
