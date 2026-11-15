# CI Jobs

Part of the [Backend Tests Speed](../pytest-all-long-test.md) specs (Epic #1785).

How the backend pytest jobs are split in CircleCI today, the durations report (#1787) and the
rebalancing approach (#1788).

## Current split

Three jobs in `.circleci/config.yml`, each with `working_directory: ~/project/backend` and its
own ephemeral `cimg/mysql:8.4.13` container:

| Job | Command | Baseline |
|-----|---------|----------|
| `pytest_views_characters` | `poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` | 5m 04s |
| `pytest_views_rest` | `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` | 3m 35s |
| `pytest_all` | `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` | **8m 34s** |

- Since #1787, every job runs these commands through the reusable `pytest_with_reports` command
  in `.circleci/config.yml`, which appends `--durations=0 --junitxml=test-reports/junit.xml -o
  junit_family=xunit1` and publishes the reports (see
  [Durations report](#durations-report-1787)).
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

Every pytest job publishes a durations report, so per-file and per-test timings are available
for every pipeline. The first numbers are in [Baseline](baseline.md) and the hypothesis statuses
in [Cost drivers](cost-drivers.md#hypotheses).

### How it runs

The three jobs call the reusable `pytest_with_reports` command (top-level `commands:` in
`.circleci/config.yml`) with their own `paths`. It runs, from `~/project/backend`:

```bash
mkdir -p test-reports
poetry run pytest <paths> --cov --cov-report=lcov:coverage/lcov.info \
  --durations=0 --junitxml=test-reports/junit.xml -o junit_family=xunit1 \
  | tee test-reports/pytest-output.txt
```

- CircleCI runs steps with `bash -eo pipefail`, so a pytest failure still fails the job through
  the `tee` pipe.
- `-o junit_family=xunit1` adds a `file` attribute to every `testcase`, used by the summary
  script and by `circleci tests split --split-by=timings` (#1788).
- The "Upload coverage to Codacy (partial)" step follows, unchanged.
- A "Durations report" step (`when: always`) extracts the `slowest durations` section of the
  output into `durations.txt` and runs `bin/junit_summary.py`; each part is skipped when its
  input is missing (pytest crashed before writing it), so the original failure stays visible.
- `store_test_results` and `store_artifacts` then publish `backend/test-reports/` (kept out of
  git by `.gitignore`).

### Artifacts

In each pytest job, the **Artifacts** tab lists, under `test-reports/`:

| File | Content |
|------|---------|
| `pytest-output.txt` | The full pytest console output. |
| `durations.txt` | The `--durations=0` list: one line per phase (`setup`, `call`, `teardown`) of each test, slowest first. Phases under 0.005s are hidden by pytest and summarized in a final line. |
| `durations-by-file.md` | Per-file and per-directory totals built from the JUnit XML. |
| `junit.xml` | The JUnit XML (xunit1). |

The **Tests** tab shows the same JUnit results per test, with their timings; CircleCI keeps them
as the timing history used by timing-based splitting.

### Reading the reports

- `durations-by-file.md` starts with the number of tests, the sum of the test times and the
  test suite wall time, then two tables sorted by total time: **per file** and **per
  directory** (each file's parent directory), with test count, total seconds, share of the sum
  and average per test. A test's JUnit time includes its setup, call and teardown.
- To see how much a group of files takes (e.g. the 10 transactional files in `pytest_all`), add
  their rows' totals and divide by the sum of test times.
- `durations.txt` splits each test into phases: a large `setup` points at fixtures,
  `setup_method`/`setUp` or database work (e.g. transactional flushes); a large `call` points at
  the test body itself.
- The gap between the job's duration and the test suite wall time is the job overhead
  (container start, `poetry install`, waiting for MySQL, coverage upload).

### Running the summary locally

Only inside the `majora_tests` container, never on the host:

```bash
docker-compose run --rm majora_tests sh -c "poetry run pytest common/tests \
  --junitxml=/tmp/junit.xml -o junit_family=xunit1 -q \
  && poetry run python bin/junit_summary.py /tmp/junit.xml /tmp/durations-by-file.md \
  && cat /tmp/durations-by-file.md"
```

Usage: `python bin/junit_summary.py <junit.xml> <output.md>`. The script uses the standard
library only, falls back to the `classname` when a `testcase` has no `file` attribute (the
default `xunit2` family), counts skipped and failed tests like any other, and exits non-zero only
when the input is missing or unreadable. #1788 can run it on each new job's `junit.xml` to check
that the split is balanced.

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
