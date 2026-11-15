# Issue: Backend tests speed: publish a durations report for every pytest job

## Description

Part of Epic #1785, which reduces the backend pytest suite runtime (CI first, local runs too). CI is currently held up by the `pytest_all` job at 8m 34s; `pytest_views_characters` takes 5m 04s and `pytest_views_rest` 3m 35s (pipeline 5881, see [Baseline](docs/agents/specs/pytest-all-long-test/baseline.md)).

Make every pytest CI job publish a durations report (per test and per file) as CircleCI artifacts and test results, then record the first report's numbers in the specs, so the rest of the Epic targets what is actually slow.

## Problem

Nobody knows where `pytest_all`'s 8m 34s goes. The original hypothesis (view tests with `setup_method` dominate) is weakened by the baseline: `pytest_all` runs no view tests (`--ignore=games/tests/views/`) yet is the slowest job. A leading suspect is the 10 transactional test files (4 of them migration tests), which all run in `pytest_all`. Every hypothesis in [Cost drivers](docs/agents/specs/pytest-all-long-test/cost-drivers.md#hypotheses) is still `open`, and any optimization before measuring is a guess.

pytest `--durations` only lists single tests, so it cannot answer per-file questions such as "how much of `pytest_all` do the 10 transactional files take?" on its own.

## Expected Behavior

- Each of the three pytest jobs in `.circleci/config.yml` (`pytest_views_characters`, `pytest_views_rest`, `pytest_all`) publishes, as CircleCI artifacts:
  - the **full** pytest durations list (`--durations=0`, every test, with setup, call and teardown listed separately), saved to a file rather than relying on the console log;
  - a **per-file summary**: test files (and their parent directories) sorted by total time, with test counts, produced from the JUnit XML by a new script;
  - the JUnit XML itself.
- Each job also runs `store_test_results` on the JUnit XML, so CircleCI keeps per-test timings (needed by #1788 if it chooses timing-based splitting).
- A test failure still fails the job, and the reports are still stored when tests fail (`when: always`).
- Coverage upload to Codacy keeps working unchanged; `coverage-final` and the release jobs' `requires` are untouched (no job is renamed here).
- After the PR's own pipeline has run, the same PR also records the first numbers:
  - [Baseline](docs/agents/specs/pytest-all-long-test/baseline.md): the slowest tests and files per job, the share of `pytest_all` taken by the 10 transactional files (and by the 4 migration tests), and the setup vs call split; plus a History row.
  - [Cost drivers](docs/agents/specs/pytest-all-long-test/cost-drivers.md#hypotheses): hypothesis 1 and hypothesis 3 marked confirmed or ruled out with the pipeline number as evidence; the others stay `open` unless the report settles them.
  - [CI jobs](docs/agents/specs/pytest-all-long-test/ci-jobs.md#durations-report-1787): the "Planned by #1787" placeholder replaced by the exact flags, artifact paths, the script's usage and how to read the reports.

## Solution

- **pytest flags:** add `--durations=0 --junitxml=<path>` to each job's pytest command (keep `--cov --cov-report=lcov:coverage/lcov.info`). Write the durations section to a file (for example, `tee` the output, which is safe under CircleCI's default `bash -eo pipefail`, then extract the "slowest durations" block). No new pytest plugin is added.
- **Per-file script:** a small, dependency-free Python script in `backend/bin/` (outside the coverage `source` and the pytest `testpaths`), run in the job with `poetry run python bin/<name>.py <junit.xml> <output>` after pytest. It sums the `time` of each `testcase` by file and by directory and writes a sorted plain-text (or Markdown) table. #1788 can reuse it to compare job balance. It is never run on the host, only in CI or in the `majora_tests` container.
- **CircleCI steps:** `store_artifacts` for the durations file, the per-file summary and the JUnit XML, and `store_test_results` for the JUnit XML, all with `when: always`. Use a single reports directory per job (for example, `backend/test-reports/`), and keep it out of git (`.gitignore`).
- **Spec fix:** `ci-jobs.md` and `cost-drivers.md` say each job uses `cimg/mysql:8.0`; the config uses `cimg/mysql:8.4.13`. Correct the spec while editing it.
- No test or application change. Update `.claude/agents/infra.md` only if it describes the pytest job steps.
- **Owner:** `infra` agent (CI config and the script). Depends on #1786 (merged, spec pages exist). Must land before #1788, which edits the same config file and uses this report to choose the new split.

### Verification (applies to every test or CI change in this Epic)

- `pytest --collect-only -q` lists the same node IDs before and after, except for renames the PR lists explicitly.
- The full suite passes in CI; no test is skipped, marked `xfail` or deleted to get there.
- Codacy total coverage does not drop.
- The PR description reports the before and after time of the affected CI jobs, and the new numbers are added to `baseline.md`.
- Specific to this issue: `circleci config validate` passes, the PR links the pipeline whose artifacts were used, and each of the three jobs shows its artifacts and a populated Tests tab in that pipeline.

## Benefits

- Every pipeline from now on shows where the time goes, per test and per file, at no extra cost to the developer.
- The Epic's next steps (#1788 rebalancing, choosing which modules to convert) are based on measured numbers instead of guesses.
- The per-file script gives #1788 a ready tool to check that its new split is balanced.
