# Plan: Break source/games/tests/views_test.py into separated files

Issue: [146-break-views-test-into-files.md](../issues/146-break-views-test-into-files.md)

## Overview

Split the 1244-line `source/games/tests/views_test.py` into three focused test files under a new `source/games/tests/views/` package, mirroring the production `source/games/views/` structure. All 14 test classes are redistributed; the original file is deleted.

## Context

The production code was already split into `source/games/views/games.py`, `characters.py`, and `game_masters.py`. The test file still holds all 14 test classes in a single 1244-line file, making navigation difficult and the structure inconsistent.

## Implementation Steps

### Step 1 — Create the views test package

Create `source/games/tests/views/__init__.py` (empty) to make the directory a Python package.

### Step 2 — Create games_test.py

Create `source/games/tests/views/games_test.py` containing:
- `TestGamesListView` (lines 14–88 in the original)
- `TestGameDetailView` (lines 90–133)

Copy the module-level imports verbatim from the original file header.

### Step 3 — Create characters_test.py

Create `source/games/tests/views/characters_test.py` containing:
- `TestGamePcsView` (lines 135–202)
- `TestGameNpcsView` (lines 204–279)
- `TestGameNpcDetailView` (lines 281–377)
- `TestGameNpcUpdateView` (lines 379–521)
- `TestGamePcDetailView` (lines 523–624)
- `TestGamePcUpdateView` (lines 626–764)
- `TestGameNpcFullView` (lines 766–853)
- `TestGamePcFullView` (lines 855–944)
- `TestGamePcAccessView` (lines 1064–1153)
- `TestGameNpcAccessView` (lines 1155–1244)

Copy the module-level imports verbatim.

### Step 4 — Create game_masters_test.py

Create `source/games/tests/views/game_masters_test.py` containing:
- `TestGameMastersListView` (lines 946–1012)
- `TestGameMasterDetailView` (lines 1014–1062)

Copy the module-level imports verbatim.

### Step 5 — Delete the original file

Remove `source/games/tests/views_test.py` — all test classes have been migrated and there is nothing left in the original that is not covered by the new files.

### Step 6 — Verify

Run the full pytest suite to confirm all tests still pass and no import errors were introduced.

## Files to Change

- `source/games/tests/views/__init__.py` — new (empty package marker)
- `source/games/tests/views/games_test.py` — new (games list and detail tests)
- `source/games/tests/views/characters_test.py` — new (all character-related view tests)
- `source/games/tests/views/game_masters_test.py` — new (game masters list and detail tests)
- `source/games/tests/views_test.py` — deleted

## CI Checks

- `source/`: `docker-compose run --rm majora_tests pytest` (CI job: `pytest`)
- `source/`: `docker-compose run --rm majora_tests ruff check --fix .` (CI job: `checks`)

## Notes

- No production code changes — this is a pure test reorganization.
- Import sets in each new file can be trimmed to only what is actually used in that file, but copying verbatim from the original is safe and correct.
- `conftest.py` fixtures are shared automatically by pytest; no changes needed there.
