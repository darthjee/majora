# Backend tests speed: make the two slow migration tests cheap

## Context

Part of Epic #1785. Spawned while refining #1788.

The durations report from #1787 (pipeline 5900, see `docs/agents/specs/pytest-all-long-test/baseline.md`)
shows that two migration test files take about half of `pytest_all`:

| File | Total |
|------|------:|
| `games/tests/models/game/game_treasure_hidden_backfill_migration_test.py` | 113.50s |
| `games/tests/models/character/character_public_slain_migration_test.py` | 110.33s |

Each one spends about 70s in a single test's call (rolling the schema back to an old `games`
migration and then forward) and about 40s in teardown (`tearDownClass` migrating the whole
project forward to the latest leaf nodes). The other migration test files take only a few
seconds.

Even after #1788 rebalances the CI jobs, neither file can be split, so each sets a floor of about
113s on whatever container runs it. Locally, they add about 4 minutes to every full run.

## What needs to be done

Backend (investigated and implemented by the `backend` agent):

- Migrate back only to the target app's previous migration, with the smallest set of dependent
  migrations, instead of rolling back far through the graph.
- In `tearDownClass`, migrate forward only the nodes that were rolled back, not every leaf node.
- Compare with how the faster migration tests do it (e.g. `password_reset_token_table_migration_test.py`,
  7.17s) and reuse or extract a shared helper if one makes sense.

Docs:

- Record the before and after times in `docs/agents/specs/pytest-all-long-test/baseline.md`.

## Acceptance criteria

- [ ] Both files still exercise the real backfill migration; the behaviour checked and coverage stay the same.
- [ ] Each file runs in a few seconds, in line with the other migration tests.
- [ ] `pytest --collect-only -q` output is identical before and after.
- [ ] CI is green and Codacy coverage does not drop.
- [ ] Before and after times are recorded in `baseline.md`.
