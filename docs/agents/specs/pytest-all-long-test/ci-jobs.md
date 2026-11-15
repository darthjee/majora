# CI Jobs

Part of the [Backend Tests Speed](../pytest-all-long-test.md) specs (Epic #1785).

How the backend pytest jobs are split in CircleCI, the durations report (#1787) and the
rebalancing (#1788).

## Current split

Three jobs in `.circleci/config.yml`, each with `working_directory: ~/project/backend`. Every job,
and every container of a parallel job, has its own ephemeral `cimg/mysql:8.4.13` container:

| Job | Scope (`paths` passed to `pytest_with_reports`) | How it is split | Before #1788 (pipeline 5900) |
|-----|--------------------------------------------------|-----------------|------------------------------|
| `pytest_views_game` (was `pytest_views_characters`) | `games/tests/views/game/` | One job | 4m 58s |
| `pytest_views_rest` | `games/tests/views/ --ignore=games/tests/views/game/` | One job | 2m 55s |
| `pytest_non_views` (was `pytest_all`) | `$TEST_FILES`: this container's share of every `*_test.py` under the `testpaths`, except `games/tests/views/` | `parallelism: 3`, split by timings | **8m 08s** |

- Every job runs pytest through the reusable `pytest_with_reports` command in
  `.circleci/config.yml`, which appends `--cov --cov-report=lcov:coverage/lcov.info
  --durations=0 --junitxml=test-reports/junit.xml -o junit_family=xunit1` and publishes the
  reports (see [Durations report](#durations-report-1787)).
- `pytest_non_views` runs a "Split test files" step before `pytest_with_reports`, in each
  container:
  1. It reads every `testpaths` entry from `backend/pyproject.toml` (so the list never drifts
     from it) and globs `<testpath>/*_test.py` and `<testpath>/**/*_test.py` with
     `circleci tests glob`. The `testpaths` matter: `majora_project/settings_test.py` matches
     `*_test.py` but is not a test file.
  2. It removes duplicates (`sort -u`) and everything under `games/tests/views/`
     (`grep -v '^games/tests/views/'`), which replaces the old `--ignore=games/tests/views/`.
  3. It pipes the list to `circleci tests split --split-by=timings --timings-type=filename`,
     writes the container's share to `test-reports/test-files.txt`, fails if that share is
     empty (pytest would otherwise run every `testpaths` entry) and exports it as `TEST_FILES`
     through `$BASH_ENV`.
  4. `pytest_with_reports` then runs with `paths: "$TEST_FILES"`; the parameter is expanded
     unquoted, so the shell splits the list into one argument per file.
- The 10 transactional and migration test files (see
  [Edge cases](edge-cases.md#transactional-tests)) all run in `pytest_non_views`, spread across
  its containers.
- In the workflow, each pytest job runs on every branch and tag (`filters: *all_tags`) and
  requires the `release-circleci_majora-base` and `release-circleci_majora-base-arm64` jobs.

## Coverage

- Each pytest job, and each `pytest_non_views` container, uploads its own partial coverage to
  Codacy in a step named "Upload coverage to Codacy (partial)": `bash <(curl -Ls
  https://coverage.codacy.com/get.sh) report --partial -r coverage/lcov.info`.
- `coverage-final` requires `pytest_views_game`, `pytest_views_rest`, `pytest_non_views`,
  `jasmine` and `client_tests`, then runs the Codacy `final` command. A parallel job is required
  by its single name, and is done only when all its containers are.
- Every new or renamed pytest job must keep uploading its partial coverage, and `coverage-final`
  must require all of them, so total coverage stays the same.

## Release jobs that depend on the pytest jobs

The tag-only release jobs (`filters: *tags_only`) list all three pytest jobs
(`pytest_views_game`, `pytest_views_rest`, `pytest_non_views`) in `requires`:
`build-and-release`, `upload_proxy_files`, `upload_fe_files`, `link_photos`, `link_files`,
`link_domain`, `upload_admin_assets`, `wake-navi` and `client-release`. A rename or a new pytest
job must update every one of them, as well as `coverage-final`. Tag builds do not run on pull
requests, so check a rename with `circleci config validate` and a `grep` for the old names in
`.circleci/config.yml`.

## Durations report (#1787)

Every pytest job, and every `pytest_non_views` container, publishes its own durations report, so
per-file and per-test timings are available for every pipeline. The first numbers are in [Baseline](baseline.md) and the hypothesis statuses
in [Cost drivers](cost-drivers.md#hypotheses).

### How it runs

The three jobs (each `pytest_non_views` container with its own `$TEST_FILES`) call the reusable `pytest_with_reports` command (top-level `commands:` in
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
  script and by `circleci tests split --split-by=timings --timings-type=filename` in
  `pytest_non_views` (#1788). The paths are relative to `backend/`, like the globbed file list.
- The "Upload coverage to Codacy (partial)" step follows, unchanged.
- A "Durations report" step (`when: always`) extracts the `slowest durations` section of the
  output into `durations.txt` and runs `bin/junit_summary.py`; each part is skipped when its
  input is missing (pytest crashed before writing it), so the original failure stays visible.
- `store_test_results` and `store_artifacts` then publish `backend/test-reports/` (kept out of
  git by `.gitignore`).

### Artifacts

In each pytest job, the **Artifacts** tab lists, under `test-reports/`, one set of files per
container (`pytest_non_views` shows a set for each of its containers, numbered from 0):

| File | Content |
|------|---------|
| `pytest-output.txt` | The full pytest console output. |
| `durations.txt` | The `--durations=0` list: one line per phase (`setup`, `call`, `teardown`) of each test, slowest first. Phases under 0.005s are hidden by pytest and summarized in a final line. |
| `durations-by-file.md` | Per-file and per-directory totals built from the JUnit XML. |
| `junit.xml` | The JUnit XML (xunit1). |
| `test-files.txt` | `pytest_non_views` only: the test files given to this container, one per line. The union of all containers' lists, plus the two view jobs' paths, is the full suite. |

The **Tests** tab shows the same JUnit results per test, with their timings; CircleCI keeps them
as the timing history used by timing-based splitting.

### Reading the reports

- `durations-by-file.md` starts with the number of tests, the sum of the test times and the
  test suite wall time, then two tables sorted by total time: **per file** and **per
  directory** (each file's parent directory), with test count, total seconds, share of the sum
  and average per test. A test's JUnit time includes its setup, call and teardown.
- To see how much a group of files takes (e.g. the 10 transactional files in
  `pytest_non_views`), add their rows' totals across the containers and divide by the sum of
  test times.
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
when the input is missing or unreadable. Run it on each container's `junit.xml` to check that
the split is balanced.

## Rebalancing (#1788)

Done by #1788, from #1787's durations report (pipeline 5900): `pytest_all` 8m 08s,
`pytest_views_characters` 4m 58s, `pytest_views_rest` 2m 55s, `test` workflow 8m 54s. The new
numbers and the CI target are in [Baseline](baseline.md).

### Choice: hybrid split

The two view jobs stay path-based (`pytest_views_characters` is renamed `pytest_views_game`,
after what it runs), and the rest of the suite (`pytest_all`, renamed `pytest_non_views`) runs
in parallel containers split by recorded timings. Two inputs drove the choice:

- Two migration test files take 113.50s and 110.33s, about half of `pytest_all`. Each runs as one
  unit, so whichever job or container runs one of them takes at least that long (speeding them
  up is #1798).
- Every job or container pays a fixed cost of about 80s: about 50s to create and migrate the
  test database, plus `poetry install`, waiting for MySQL and the coverage upload.

It was chosen over two alternatives:

- **Pure path-based split**, with a separate migrations job: it leaves about 5.2m on the
  critical path and must be re-tuned by hand after every later sub-issue (#1789–#1794, #1798).
- **`parallelism` over the whole suite:** it needs more containers, and each one pays the ~80s
  fixed cost.

The parallel `pytest_non_views` rebalances itself from the stored JUnit timings as later
sub-issues change the costs, and every job name now matches what it runs.

### `parallelism` value

`parallelism: 3`: about (409s of work + 3 × 80s fixed cost) / 3 ≈ 3.6m per container, under
`pytest_views_game` (about 5m), and enough containers for the two slow migration files to land in
different ones. Tune it between 2 and 4 from the recorded runs; if one container still takes much
longer than the others because both slow migration files land in it, try `parallelism: 4` first.
Never change the tests to balance the split.

### Timing history

`circleci tests split --split-by=timings` reads the timings stored by `store_test_results` for
the same job name. On the first pipeline after a rename (or a new test file), there is no history
for it, so CircleCI falls back to splitting by name; the numbers of a split are only meaningful
from a later run that has timings.

### Exact coverage of the suite

Together, the jobs and containers run exactly the full suite: the union of their node IDs equals
one full `pytest --collect-only -q`, with nothing missing and nothing run twice (see
[Verification](verification.md#specific-checks)). Check it from the `test-files.txt` artifacts of
the `pytest_non_views` containers and the jobs' Tests tabs. In pipeline 5900 the full collection
was 4,805 + 2,614 + 1,671 = 9,090 tests.

### Next candidate

`pytest_views_game` (about 5m) is now the critical path. Splitting it further (for example into
its own parallel job) is the next candidate, out of the scope of #1788.

### Renames

The `protect main` ruleset has no required status checks (checked 2026-11-15), so renaming jobs
breaks no PR check; confirm it again just before merging a rename. A rename must also update the
release jobs' and `coverage-final`'s `requires` and the job names listed in
`docs/agents/contributing.md` and `.claude/agents/infra.md`.
