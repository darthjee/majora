# Issue: Backend tests speed: rebalance the CI pytest jobs

## Description

Part of Epic #1785, which makes the backend pytest suite faster (CI first, then local runs). This change uses the durations report from #1787 (pipeline 5900, recorded in `docs/agents/specs/pytest-all-long-test/baseline.md`).

Use a hybrid approach to rebalance the CI pytest jobs. The two view jobs stay path-based, and the job that runs the rest of the suite is split across parallel containers by recorded timings. The pipeline then stops waiting on one oversized job, and every job name matches what it runs.

## Problem

The three pytest jobs are unbalanced. In pipeline 5900:

| Job | Duration | pytest wall time |
|-----|---------:|-----------------:|
| `pytest_all` | 8m 08s | 459.8s |
| `pytest_views_characters` | 4m 58s | 226.5s |
| `pytest_views_rest` | 2m 55s | 122.1s |

Every other workflow job finishes in under a minute. `pytest_all` alone sets the workflow time (about 8m 54s), and `coverage-final` waits on it.

- Two migration test files take 113.50s and 110.33s, about half of `pytest_all`. Each runs as one unit, so the container that runs it takes at least that long. Speeding them up is #1798, not this issue.
- Every job or container also pays a fixed cost of about 80s: about 50s to create and migrate the test database, plus `poetry install`, waiting for MySQL and the coverage upload.
- `pytest_views_characters` actually runs `games/tests/views/game/`, not character views.

## Expected Behavior

- **Jobs after the change:**

  | Job | Scope | How it is split |
  |-----|-------|-----------------|
  | `pytest_views_game` (renamed from `pytest_views_characters`) | `games/tests/views/game/` | One job, unchanged scope |
  | `pytest_views_rest` | `games/tests/views/ --ignore=games/tests/views/game/` | One job, unchanged |
  | `pytest_non_views` (renamed from `pytest_all`) | Every `*_test.py` under the `testpaths` in `backend/pyproject.toml`, except `games/tests/views/` | CircleCI `parallelism` (start with 3) and `circleci tests split --split-by=timings --timings-type=filename` |

- **Balanced:** the two slow migration files land in different `pytest_non_views` containers. No container takes much longer than `pytest_views_game` (about 5m), which becomes the critical path.
- **CI target:** the `test` workflow wall-clock time is at most **5m 30s**, recorded in the `Targets` section of `baseline.md`. Later sub-issues (#1789–#1794, #1798) are expected to bring it down further. The local target stays with #1794.
- **Exact coverage of the suite:** together, the jobs and containers run exactly the full suite. The union of their test node IDs equals one full `pytest --collect-only -q` run, with nothing missing and nothing run twice. Each `pytest_non_views` container stores the list of files it was given as an artifact, so this can be checked.
- **Coverage:** every job and every container keeps the "Upload coverage to Codacy (partial)" step. `coverage-final` requires all pytest jobs, so total coverage stays the same.
- **Reports:** every job and container keeps the #1787 durations report (`pytest_with_reports`), so each container has its own `test-reports/` artifacts and Tests tab.
- **Release jobs keep working:** every tag-only job whose `requires` lists the pytest jobs is updated to the new names, along with `coverage-final`. Those jobs are `build-and-release`, `upload_proxy_files`, `upload_fe_files`, `link_photos`, `link_files`, `link_domain`, `upload_admin_assets`, `wake-navi` and `client-release`. Tag builds do not run on pull requests, so the PR must show this with `circleci config validate` and a grep that finds no `pytest_all` or `pytest_views_characters` left in `.circleci/config.yml`.
- **Docs list the new job names:**
  - `docs/agents/contributing.md`: the table of CI jobs per folder.
  - `.claude/agents/infra.md`: the pipeline diagram and the job table.
  - `.claude/agents/backend.md`, if it names the jobs.
  - `docs/agents/specs/pytest-all-long-test/ci-jobs.md`: "Current split", "Coverage" and "Release jobs" are updated, and "Rebalancing (#1788)" records the hybrid choice and why it was made.

## Solution

- **Approach: hybrid.** It was chosen over two alternatives:
  - A pure path-based split, with a separate migrations job. It leaves about 5.2m on the critical path and must be re-tuned by hand after every later sub-issue.
  - Parallelism over the whole suite. It needs more containers, and each one pays the ~80s fixed cost.

  The parallel `pytest_non_views` job rebalances itself from the stored JUnit timings as #1789–#1794 and #1798 change the costs.
- **Splitting:**
  - Build the file list with `circleci tests glob` over the `testpaths` (`*_test.py`).
  - Drop everything under `games/tests/views/`.
  - Pipe the list to `circleci tests split --split-by=timings --timings-type=filename`.
  - Pass the resulting files to `pytest_with_reports`, which needs a parameter or a variant that accepts the file list.

  The xunit1 `file` attribute from #1787 supplies the per-file timings. On the first run under the new job name there is no timing history yet, so CircleCI falls back to splitting by name. The PR records the numbers from a run that does have timings.
- **Parallelism value:** start at 3, which is about (409s of work + 3 × 80s fixed cost) / 3 ≈ 3.6m per container. Tune it to 2–4 from the first runs, and record the chosen value and the reason in `ci-jobs.md`.
- **Renames are safe:** the `protect main` ruleset has no required status checks (checked 2026-11-15), so renaming jobs breaks no PR check. Confirm this again just before merging.
- **Scope:** no test, application or coverage-configuration change. Owner: the `infra` agent. Depends on #1787 (merged).

### Verification (applies to every test or CI change in this Epic)

- `pytest --collect-only -q` lists the same node IDs before and after. The union across all pytest jobs and `pytest_non_views` containers equals the full collection.
- The full suite passes in CI. No test is skipped, marked `xfail` or deleted to get there.
- Codacy total coverage does not drop.
- The PR description gives the before (pipeline 5900) and after times of each pytest job, each container and the `test` workflow. `baseline.md` gets a History row and the new CI target.

## Benefits

- The workflow wall-clock time drops from about 8m 54s to about 5m, with no test change.
- The parallel job rebalances itself as later Epic sub-issues change test costs.
- Job names describe what they run.
