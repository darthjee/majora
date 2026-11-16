# Issue: Backend tests speed: split the view test jobs into parallel containers

## Description

Part of Epic #1785 (backend test suite is slow). After #1788 and #1798, the CI critical path is `pytest_views_game` at **4m 56s** (pipeline 5913). By comparison, `pytest_views_rest` takes 2m 58s and the parallel `pytest_non_views` takes 2m 33s. The workflow `test` takes 5m 12s, and `coverage-final` waits on `pytest_views_game`.

No single module in `games/tests/views/` is slow. The cost is many small setups: in pipeline 5900, `games/tests/views/game/` spent 85.20s in setup outside the test database creation, against 66.74s in call.

This sub-issue merges `pytest_views_game` and `pytest_views_rest` into one `pytest_views` job with `parallelism: 3`, split by recorded timings over all of `games/tests/views/`. It reuses the approach #1788 built for `pytest_non_views` and changes no test.

## Problem

- `pytest_views_game` runs 2,614 tests (184 files) in one container: a pytest wall time of 268.08s in pipeline 5913, about 50s of which is test database creation.
- `pytest_views_rest` runs 1,671 tests (90 files): 106.27s, about 45s of which is test database creation.
- Every job or container pays a fixed cost of about 80s: test database creation and migration, `poetry install`, waiting for MySQL, and the coverage upload. So the number of containers must stay small.
- `pytest_views_game` is split from `pytest_views_rest` by a hand-picked path, which has to be re-tuned by hand as costs change.

## Expected Behavior

- A single `pytest_views` job runs every test file under `games/tests/views/`, with `parallelism: 3` and the files split by recorded timings.
- `pytest_views_game` and `pytest_views_rest` no longer exist.
- Each container's duration is at most about 3m 30s (estimate: about 280s of view-test work / 3, plus the ~80s fixed cost, is about 3m). No pytest job or container is clearly the critical path.
- The workflow `test` wall-clock time drops, moving toward the Epic's CI target of **at most 4m**.
- Together, `pytest_views` and `pytest_non_views` run exactly the full suite: nothing missing, nothing run twice.

## Solution

### CI job (`.circleci/config.yml`)

- Replace the `pytest_views_game` and `pytest_views_rest` jobs with one `pytest_views` job, with `parallelism: 3` and the same executor, MySQL service and steps as `pytest_non_views`.
- Give it a "Split test files" step built on the one in `pytest_non_views`:
  - glob `games/tests/views/*_test.py` and `games/tests/views/**/*_test.py` with `circleci tests glob`, then `sort -u`;
  - run `circleci tests split --split-by=timings --timings-type=filename` and write the share to `test-reports/test-files.txt`;
  - fail when the share is empty;
  - export the share as `TEST_FILES` and call `pytest_with_reports` with `paths: "$TEST_FILES"`.
- Prefer one shared definition of the split over two copies that can drift: either a reusable command (for example `split_test_files`) with parameters for the glob scope and exclusions, or a YAML anchor. The command used by `pytest_non_views` must keep its exact current output (same file list).
- Leave `pytest_non_views` unchanged otherwise (still `parallelism: 3`, still excluding `games/tests/views/`).
- Each `pytest_views` container keeps the durations report from #1787 (`test-reports/` artifacts, `store_test_results`) and its own partial Codacy coverage upload.

### Renames and `requires`

- In the `test` workflow, replace both old jobs with `pytest_views` (same filters, same `requires` on the base image release jobs).
- `coverage-final` and every tag-only release job that lists the pytest jobs in `requires` must list `pytest_views` and `pytest_non_views` instead of the three old names: `build-and-release`, `upload_proxy_files`, `upload_fe_files`, `link_photos`, `link_files`, `link_domain`, `upload_admin_assets`, `wake-navi`, `client-release` and any others found. Check with `circleci config validate` and a `grep` for `pytest_views_game` and `pytest_views_rest` across the repo (tag builds do not run on pull requests).
- Confirm the `protect main` ruleset still has no required status checks just before merging (`gh api repos/darthjee/majora/rulesets`).

### Edge cases

- **No timing history:** the first pipeline with `pytest_views` has no stored timings for the new job name, so CircleCI splits by name. Record the numbers from a later pipeline that splits by timings, as #1788 did.
- **Shared behavior modules:** some test classes inherit their tests from non-test modules (`games/tests/views/games/_entity_token_scopes_behavior.py`, `games/tests/views/games/_common_items_filters_behavior.py` and `games/tests/views/game/_permissions_token_scopes_behavior.py`). The JUnit `file` attribute names the module that defines the test method, so the time of those inherited tests is not credited to the `*_test.py` file that runs them, and the split under-weights those files. This is accepted: there are only a few such files, and the spread across containers is checked in the recorded run. If one container ends up much slower because of it, record that in the spec and leave the fix to a follow-up. Never change the tests to balance the split.
- **`parallelism` value:** start at 3. Tune it between 2 and 4 from the recorded runs: each extra container saves work time but pays about 80s of fixed cost.

### Documentation

- `docs/agents/specs/pytest-all-long-test/ci-jobs.md`:
  - "Current split": the new job table;
  - "Rebalancing": a #1802 subsection with the choice, merging the two view jobs, over the two rejected alternatives (`pytest_views_game` alone with parallelism 2, and one parallel `pytest` job for the whole suite);
  - "Next candidate": updated;
  - the shared behavior modules limitation.
- `docs/agents/specs/pytest-all-long-test/baseline.md`: a "Parallel view jobs (#1802)" section with per-container numbers, and a History row.
- `docs/agents/specs/pytest-all-long-test.md`: add #1798 and #1802 to the sub-issue table and the sequencing.
- `docs/agents/contributing.md` (CI jobs per folder table), `.claude/agents/infra.md` (pipeline diagram and job table) and `.claude/agents/backend.md`: the new job names.

### Verification

Follows the spec's [Verification](docs/agents/specs/pytest-all-long-test/verification.md) page:

- The `pytest --collect-only -q` output for the whole suite is the same before and after (no test file changes).
- Exact coverage: the union of the three `pytest_views` `test-files.txt` artifacts equals every `*_test.py` under `games/tests/views/`, with no file listed twice. Together with `pytest_non_views`'s lists, it covers every test file under the `testpaths`. The Tests tab counts add up to 2,614 + 1,671 = 4,285 view tests.
- A green CI run, and no drop in Codacy's total coverage.
- The PR description gives the job durations before (pipeline 5913, or the latest `main` pipeline) and after (a pipeline that splits by timings), per container and for the workflow `test`. They are added to `baseline.md`.

Agent: infra. Depends on: #1788 (done). Must land before #1795.

## Benefits

- Lowers the CI critical path from about 5m to about 3m without touching any test.
- One fewer hand-picked path split: the view tests rebalance themselves from stored timings as later sub-issues (#1790 to #1793, module conversions) change per-test costs.
- Fewer job names to keep in sync across `coverage-final`, the release jobs and the docs.
