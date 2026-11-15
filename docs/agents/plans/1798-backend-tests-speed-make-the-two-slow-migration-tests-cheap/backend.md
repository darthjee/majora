# Backend Plan: Backend tests speed: make the two slow migration tests cheap

Main plan: [plan.md](plan.md)

## Overview
`game_treasure_hidden_backfill_migration_test.py` and `character_public_slain_migration_test.py` call
`executor.migrate(<old games migration>)`. Django then unapplies every later migration in `games` and in
every app that depends on it: 114 migrations for `games.0058` and 137 for `games.0040`, each one real
MySQL DDL. `tearDownClass` then re-applies them all. Replace this with a hand-built plan that unapplies
only the migrations needed and re-applies them inside the test.

## Context
- Treasure test: from `games.0058_gametreasure_hidden` to `games.0059_backfill_gametreasure_hidden`
  (RunPython only). The only later migration that touches `Treasure`/`GameTreasure` is
  `0060_remove_treasure_hidden`, which drops `Treasure.hidden`.
- Character test: from `games.0040_task` to `games.0041_character_public_slain` (AddField + RunPython).
  The only later migration that touches those fields is `0073_rename_slain_and_allegiance_to_private`.
- The fast tests (`accounts/.../password_reset_token_table_migration_test.py`,
  `domains/tests/migrations/migrate_domain_title_test.py`) are fast only because their targets are near
  the end of the graph.
- Shared helper module: `backend/games/tests/migration_state.py` (`historical_apps`), not collected by pytest.

## Implementation Steps

### Step 1 — Add a minimal rollback helper and use it in both slow tests
Add a small helper (e.g. `MigrationRollback(nodes)`) to `backend/games/tests/migration_state.py`:
- `unapply()`: one backwards `executor.migrate(None, plan=[(graph.nodes[n], True) for n in reversed(nodes)])`.
- `apply(node)`: `executor.apply_migration(loader.project_state(<parents of node>), graph.nodes[node])`.
  Apply nodes one by one; never mix forwards and backwards in one plan, and never pass a single
  `state=` to a forward plan that skips migrations.
- `restore()`: re-apply, in order, any node not in `loader.applied_migrations`.

Rewrite both `TransactionTestCase`s with it:
- Treasure: seed with the live factories (`GameFactory`, `TreasureFactory`, `GameTreasureFactory`)
  before the rollback; unapply `0060` and `0059`; set `hidden` on the treasure with a historical
  `UPDATE`; apply `0059`; assert as today; re-apply `0060`.
- Character: seed with `CharacterFactory(private_slain=True/False)` before the rollback; unapply `0073`
  and `0041`; apply `0041`; assert with `.values_list('public_slain', flat=True).get(id=...)` (or with
  the live model after `0073` is restored); re-apply `0073`.
- Register `restore()` with `addCleanup` so the schema is always restored, even when a test fails.
  Keep `tearDownClass` (migrate to leaf nodes) as a cheap safety net.
- Keep class names, method names and the no-op reverse `TestCase`s unchanged, so
  `pytest --collect-only -q` output is identical.

### Step 2 — Verify and measure
- Capture `poetry run pytest --collect-only -q` for both files before and after; the output must match.
- Run both files with `--durations=0` before and after, and report call, teardown and total times
  per file so the architect can record them in `docs/agents/specs/pytest-all-long-test/baseline.md`
  ("History" table).
- Run the full backend suite and `ruff check .`.

## Files to Change
- `backend/games/tests/migration_state.py` — add the minimal rollback helper.
- `backend/games/tests/models/game/game_treasure_hidden_backfill_migration_test.py` — use the helper.
- `backend/games/tests/models/character/character_public_slain_migration_test.py` — use the helper.

## CI Checks
- `backend`: `docker-compose run --rm majora_tests poetry run pytest` (CI jobs: `pytest_all`,
  `pytest_views_characters`, `pytest_views_rest`)
- `backend`: `docker-compose run --rm majora_tests poetry run ruff check .`

## Notes
- Historical models at 0040/0058 do not know about later columns, so inserting with them fails under
  MySQL strict mode; seed with live factories before rolling back.
- Coverage is unaffected (`*/tests/*` and `*/migrations/*` are omitted).
- The tests must stay `TransactionTestCase`s, since DDL commits on MySQL.
- Recording the before/after numbers in `baseline.md` is done by the architect (docs scope).
