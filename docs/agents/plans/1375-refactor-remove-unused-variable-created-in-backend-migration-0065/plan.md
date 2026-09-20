# Plan: Refactor: remove unused variable 'created' in backend migration 0065

Issue: [1375-refactor-remove-unused-variable-created-in-backend-migration-0065.md](../../issues/1375-refactor-remove-unused-variable-created-in-backend-migration-0065.md)

## Overview
Discard the unused `created` flag returned by `get_or_create` in `backend/games/migrations/0065_backfill_player_dm.py` (`player, created = ...` becomes `player, _ = ...`), clearing Codacy's Pylint `W0612` finding without changing the backfill behavior.

See [backend.md](backend.md) for the full plan.
