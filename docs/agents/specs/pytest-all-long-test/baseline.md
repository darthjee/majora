# Baseline

Part of the [Backend Tests Speed](../pytest-all-long-test.md) specs (Epic #1785).

Success is measured by runtime, not by counting `INSERT` statements. This page records the
numbers every sub-issue compares against.

## CI

Recorded from CircleCI pipeline 5881 (workflow `e2f98440-57eb-497c-99cc-eb548b62991d`),
2026-11-15:

| Job | Scope (`.circleci/config.yml`) | Duration |
|-----|--------------------------------|----------|
| `pytest_all` (#95739) | `pytest --ignore=games/tests/views/` | **8m 34s** |
| `pytest_views_characters` (#95741) | `pytest games/tests/views/game/` | 5m 04s |
| `pytest_views_rest` (#95737) | `pytest games/tests/views/ --ignore=games/tests/views/game/` | 3m 35s |

Every other job in the workflow finishes in under one minute, so `pytest_all` is the critical
path of the whole pipeline: the workflow wall-clock time is about **8m 43s**, and
`coverage-final` waits on it.

Observations:

- `pytest_all` excludes `games/tests/views/` entirely, yet it is the slowest job. This
  contradicts the assumption that view tests with `setup_method` are the dominant cost, or at
  least shows the non-view tests are the bigger bottleneck for CI wall-clock time (see
  [Cost drivers](cost-drivers.md)).
- The job name `pytest_views_characters` is misleading: it runs `games/tests/views/game/`, not
  character views.
- The three jobs are unbalanced (8m 34s vs 5m 04s vs 3m 35s). Rebalancing them (#1788) is a
  cheap way to reduce wall-clock time without changing any test (see [CI jobs](ci-jobs.md)).

## How to measure

- **CI:** job durations from the CircleCI API or UI, for the pipeline of the PR's head commit,
  compared with the latest `main` pipeline. Since #1787, each pytest job also publishes a
  durations report in its Artifacts tab under `test-reports/` (`durations.txt` per test and
  phase, `durations-by-file.md` per file and directory, `junit.xml`) and populates its Tests
  tab; see [CI jobs](ci-jobs.md#durations-report-1787) for how to read it.
- **Every Epic PR** that touches tests or CI states the before and after time of the affected
  jobs (and of the affected modules, once the durations report exists) in its description, and
  appends them to the [History](#history) table below.

## Local

*Placeholder, filled in by #1794.* #1794 measures a full local run in the `majora_tests`
container, both with and without `--cov`, on a stated machine, right before and after its own
change, and records all four numbers here. Measuring both in one PR on the same machine keeps
the comparison fair.

## Targets

*Placeholder.* Concrete numeric targets for the CI workflow wall-clock time and the local
full-run time are set here once the durations report (#1787) is available.

## History

| Sub-issue | Pipeline / machine | Jobs or modules | Before | After |
|-----------|--------------------|-----------------|--------|-------|
| — | — | — | — | — |
