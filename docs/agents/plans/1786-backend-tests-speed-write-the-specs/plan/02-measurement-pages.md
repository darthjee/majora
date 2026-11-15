# Write the measurement pages

Each page starts with "Part of the [<hub title>](../pytest-all-long-test.md) specs (Epic #1785)."

- `baseline.md`:
  - **CI:** the table from #1785 (pipeline 5881, workflow `e2f98440-57eb-497c-99cc-eb548b62991d`, 2026-11-15): `pytest_all` (#95739, `pytest --ignore=games/tests/views/`) 8m 34s; `pytest_views_characters` (#95741, `games/tests/views/game/`) 5m 04s; `pytest_views_rest` (#95737, rest of `games/tests/views/`) 3m 35s; workflow wall-clock about 8m 43s, other jobs under one minute. The observations (no view tests in the slowest job; misleading job name; imbalance).
  - **How to measure:** CircleCI job durations from the API or UI; after #1787, the durations artifact per job. Every Epic PR appends its before/after numbers here.
  - **Local:** a placeholder section stating that #1794 measures a full local run in `majora_tests`, with and without `--cov`, on a stated machine, before and after its change.
  - **Targets:** set once #1787's report exists (placeholder).
- `cost-drivers.md`: the nine cost drivers and the seven hypotheses from #1785's Problem section, each hypothesis with a status (**open** for all now) and how it is confirmed or ruled out (mostly by #1787's durations report). Include the counts already known (360 files with `setup_method`, 1,337 `Token.objects.create`, 16 manual cache clears, 13 history test files, 10 transactional files).
- `ci-jobs.md`: the current three pytest jobs and their commands (from `.circleci/config.yml`), coverage upload per job and `coverage-final`; the planned durations report (#1787: `--durations`, JUnit results, artifacts); the rebalancing options (#1788: path-based split vs CircleCI `parallelism` with timing-based splitting). Note that the tag-only release jobs (`build-and-release`, `upload_proxy_files`, ...) list the pytest jobs in `requires`, so a rename must update them.

## Files to Change

- `docs/agents/specs/pytest-all-long-test/baseline.md` — new.
- `docs/agents/specs/pytest-all-long-test/cost-drivers.md` — new.
- `docs/agents/specs/pytest-all-long-test/ci-jobs.md` — new.
