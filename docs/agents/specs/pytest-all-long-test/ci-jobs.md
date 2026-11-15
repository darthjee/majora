# CI Jobs

Part of the [Backend Tests Speed](../pytest-all-long-test.md) specs (Epic #1785).

How the backend pytest jobs are split in CircleCI today, the durations report (#1787) and the
rebalancing approach (#1788).

## Current split

Three jobs in `.circleci/config.yml`, each with `working_directory: ~/project/backend` and its
own ephemeral `cimg/mysql:8.0` container:

| Job | Command | Baseline |
|-----|---------|----------|
| `pytest_views_characters` | `poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` | 5m 04s |
| `pytest_views_rest` | `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` | 3m 35s |
| `pytest_all` | `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` | **8m 34s** |

- The name `pytest_views_characters` is misleading: it runs `games/tests/views/game/`, not
  character views.
- All 10 transactional and migration test files run in `pytest_all` (see
  [Edge cases](edge-cases.md#transactional-tests)).
- In the workflow, each pytest job runs on every branch and tag (`filters: *all_tags`) and
  requires the `release-circleci_majora-base` and `release-circleci_majora-base-arm64` jobs.

## Coverage

- Each pytest job uploads its partial coverage to Codacy in a step named "Upload coverage to
  Codacy (partial)": `bash <(curl -Ls https://coverage.codacy.com/get.sh) report --partial -r
  coverage/lcov.info`.
- `coverage-final` requires `pytest_views_characters`, `pytest_views_rest`, `pytest_all`,
  `jasmine` and `client_tests`, then runs the Codacy `final` command.
- Every new or renamed pytest job must keep uploading its partial coverage, and `coverage-final`
  must require all of them, so total coverage stays the same.

## Release jobs that depend on the pytest jobs

The tag-only release jobs (`filters: *tags_only`) list all three pytest jobs in `requires`:
`build-and-release`, `upload_proxy_files`, `upload_fe_files`, `link_photos`, `link_files`,
`link_domain`, `upload_admin_assets`, `wake-navi` and `client-release`. A rename or a new pytest
job must update every one of them, as well as `coverage-final`.

## Durations report (#1787)

*Planned by #1787.* Every pytest job publishes a durations report: pytest `--durations` output
and JUnit test results, stored as CircleCI artifacts (and test results), so per-module and
per-test timings are available for every pipeline. #1787 records here the exact flags, artifact
paths and how to read the report, and fills the first numbers into [Baseline](baseline.md) and
the hypothesis statuses in [Cost drivers](cost-drivers.md#hypotheses).

## Rebalancing (#1788)

*Planned by #1788*, from #1787's measured durations. Options:

- **Path-based split:** keep separate jobs, choosing their paths so their durations are close.
  Simple and readable, but needs re-tuning as the suite changes.
- **CircleCI `parallelism` with timing-based splitting:** one job with N containers, splitting
  test files by their recorded timings (`circleci tests split --split-by=timings`). Balances
  itself, but renamed tests lose their timing history until the next run.

Constraints for #1788:

- Rename `pytest_views_characters` (or its replacement) to match what it runs.
- `main` has no branch protection, so renaming jobs does not break required status checks; still
  check for repository rulesets before renaming.
- Update the release jobs' and `coverage-final`'s `requires`, and the job names listed in
  `docs/agents/contributing.md`, `.claude/agents/infra.md` and `.claude/agents/backend.md`.
- The union of the collected tests of all jobs equals a full `pytest` run (see
  [Verification](verification.md#specific-checks)).
