# Issue: Backend tests speed: disable simple_history in tests with an opt-in

## Description

Part of Epic #1785, which reduces the backend pytest suite runtime (CI first, local runs too). CI is currently held up by the `pytest_all` job at 8m 34s; `pytest_views_characters` takes 5m 04s and `pytest_views_rest` 3m 35s (pipeline 5881).

Stop recording `simple_history` rows during tests by default, with a pytest marker that opts a test back in when it asserts on history.

## Problem

`django-simple-history` (3.13.0) and its `HistoryRequestMiddleware` are active, so every save of a versioned model writes an extra history row during tests. Application code does not read `simple_history` records at runtime; they are only exposed through `versioning/admin.py`.

Only a few tests read those rows. `GameDocumentPageHistory` (`page_history`) is a custom model, not `simple_history`, and is unaffected by this change.

## Expected Behavior

- Under `settings_test.py`, history recording is off by default (`SIMPLE_HISTORY_ENABLED = False`, or whatever switch 3.13.0 provides).
- The production settings leave it **on**; production behaviour does not change. `HistoryRequestMiddleware` stays.
- A `history` pytest marker (`@pytest.mark.history`), registered in `pyproject.toml`, re-enables recording for the marked test or class. An autouse fixture in `backend/conftest.py` applies it and restores the disabled state afterwards, so it cannot leak into the next test. It works on plain pytest classes and on `unittest.TestCase` classes.
- The marker is applied only to tests (or classes) that read `simple_history` rows, including tests that assert *no* new entry is created (they would otherwise pass vacuously):
  - `versioning/tests/historical_records_test.py`
  - `accounts/tests/models/password_reset_token_history_test.py`
  - `games/tests/models/game/game_recipe_test.py` (`test_history_is_tracked`)
  - `games/tests/views/game/pcs/detail/recipes/detail/game_pc_recipe_detail_patch_test.py` (`test_records_history`)
  - `games/tests/views/game/npcs/detail/recipes/detail/game_npc_recipe_detail_patch_test.py` (`test_records_history`)
  - `games/tests/models/copied_from_test.py` (`test_nulling_creates_no_history_entry_on_copy`)
  - any other test the implementer finds reading `.history` / historical models (grep `\.history\b` and `history_user|history_type|history_date`).
- These files are **not** marked: `common/tests/history_test.py` (pure unit), `accounts/tests/models/authorization_request_test.py` (only inspects the history model `_meta`), `staff/tests/staff_copies_documents_test.py`, `games/tests/models/game/game_document_page_history_test.py`, `games/tests/views/games/game_document_pages_all_test.py`, `game_document_pages_bump_version_test.py` and `game_document_page_detail_test.py` (all `GameDocumentPageHistory`).
- Tests assert: history is off by default under the test settings; the marker turns it on and the next test sees it off again; the production settings module does not disable it.
- `cost-drivers.md` (and `isolation-policy.md` for the marker) are updated.

## Solution

- Use the switch the library itself offers in 3.13.0 (the `SIMPLE_HISTORY_ENABLED` setting, read at save time, or its context manager), not model patching. The marker fixture toggles it with `django.test.override_settings` / pytest-django `settings`.
- Owner: `backend` agent. Depends on #1786.

### Verification (applies to every test or CI change in this Epic)

- `pytest --collect-only -q` lists the same node IDs before and after, except for renames the PR lists explicitly (new tests for the marker are added).
- The full suite passes in CI; no test is skipped, marked `xfail` or deleted to get there.
- Codacy total coverage does not drop.
- The PR description reports the before and after time of the affected CI jobs, and the new numbers are added to `baseline.md`.
