# Issue: Refactor: remove unused variable 'created' in backend migration 0065

## Description
Codacy's Pylint scan (`W0612`, UnusedCode, Info severity) flags an unused variable `created` at `backend/games/migrations/0065_backfill_player_dm.py:21`.

## Problem
In `_backfill_player_dm`, `Player.objects.get_or_create(...)` returns a `(player, created)` tuple, but `created` is never read. The loop unconditionally sets `player.is_dm = True` and saves it, whether the row was just created or already existed, so the flag carries no logic.

## Expected Behavior
- The unused `created` variable no longer appears in migration 0065.
- The backfill behavior is unchanged: one `Player(is_dm=True)` row per `GameMaster` row, created if missing and otherwise updated.
- Codacy's Pylint `W0612` finding clears for this file.
- The migration still applies cleanly.

## Solution
Backend only. In `backend/games/migrations/0065_backfill_player_dm.py:21`, discard the flag explicitly by changing `player, created = Player.objects.get_or_create(...)` to `player, _ = Player.objects.get_or_create(...)`. Do not gate the logic on `created`: existing players must still be marked `is_dm=True`, so the flag isn't needed.
