# Plan: Refactor: remove unused variable 'created' in backend migration 0065

Main plan: [plan.md](plan.md)

## Overview
Codacy's Pylint scan (`W0612`) flags the unused `created` variable in `_backfill_player_dm`. `Player.objects.get_or_create(...)` returns `(player, created)`, but `created` is never read: the loop sets `is_dm = True` and saves for every `GameMaster` row, whether the `Player` was just created or already existed. The fix is to discard the flag explicitly.

## Context
`backend/games/migrations/0065_backfill_player_dm.py:21` currently reads `player, created = Player.objects.get_or_create(...)`. The migration must still mark existing players as DMs, so gating the logic on `created` would change behavior and is out of scope.

## Implementation Steps

### Step 1 — Discard the unused `created` flag
In `_backfill_player_dm`, change `player, created = Player.objects.get_or_create(` to `player, _ = Player.objects.get_or_create(`. Leave the rest of the migration untouched, so the backfill behavior is unchanged.

## Files to Change
- `backend/games/migrations/0065_backfill_player_dm.py` — rename the unused `created` unpacking target to `_` (line 21)

## CI Checks
- `backend`: `poetry run ruff check .` (CI job: `checks`)
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)

## Notes
- No behavior change, no new migration, no test change needed: this is a one-token rename in an already-applied migration.
- Codacy's Pylint `W0612` finding should clear once the change is on the PR; that can only be confirmed from Codacy, not locally.
