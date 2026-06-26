# Issue: Break source/games/tests/views_test.py into separated files

## Description
The `source/games/tests/views_test.py` file (1244 lines, 14 test classes) should be split into separate files under `source/games/tests/views/` to mirror the structure of `source/games/views/`. The auth and password reset tests already have their own files (`auth_test.py` and `password_reset_test.py`); this issue covers the remaining game, character, and game master view tests.

## Problem
The test file `source/games/tests/views_test.py` has grown to 1244 lines with 14 test classes. The production code was already split into separate files under `source/games/views/` (`games.py`, `characters.py`, `game_masters.py`, etc.), but the corresponding tests remain in a single large file, making it hard to navigate and inconsistent with the production structure.

## Expected Behavior
Test classes should be distributed into separate files under `source/games/tests/views/`, mirroring the views module:
- `views/games_test.py` → `TestGamesListView`, `TestGameDetailView`
- `views/characters_test.py` → `TestGamePcsView`, `TestGameNpcsView`, `TestGameNpcDetailView`, `TestGameNpcUpdateView`, `TestGamePcDetailView`, `TestGamePcUpdateView`, `TestGameNpcFullView`, `TestGamePcFullView`, `TestGamePcAccessView`, `TestGameNpcAccessView`
- `views/game_masters_test.py` → `TestGameMastersListView`, `TestGameMasterDetailView`

The original `views_test.py` is removed once all tests are migrated.

## Solution
1. Create `source/games/tests/views/` directory with an `__init__.py`.
2. Create `games_test.py`, `characters_test.py`, and `game_masters_test.py` under that directory, each containing the corresponding test classes.
3. Update all imports in the new files.
4. Delete the original `source/games/tests/views_test.py`.

## Benefits
- Consistent structure between production code and tests.
- Easier navigation — find tests for a given view file in the corresponding test file.
- Smaller, more focused test files.
