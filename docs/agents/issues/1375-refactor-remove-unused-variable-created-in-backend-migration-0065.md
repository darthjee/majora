# Refactor: remove unused variable 'created' in backend migration 0065

## Context

Codacy's Pylint scan (`W0612`, UnusedCode, Info severity) flags an unused variable `created` at `backend/games/migrations/0065_backfill_player_dm.py:21`.

## What needs to be done

Backend: review `backend/games/migrations/0065_backfill_player_dm.py:21` and either use the `created` value (if it was meant to gate logic, e.g. skip already-backfilled rows) or discard it explicitly (`_`, or drop the unpacking) if it's genuinely unneeded.

## Acceptance criteria

- [ ] The unused `created` variable is either used or removed from migration 0065
- [ ] The migration still applies cleanly and the backfill behavior is unchanged
- [ ] Codacy's Pylint `W0612` finding clears for this file
