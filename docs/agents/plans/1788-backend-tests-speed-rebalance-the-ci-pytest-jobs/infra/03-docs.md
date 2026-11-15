# 03 — Update the docs

- `docs/agents/specs/pytest-all-long-test/ci-jobs.md`:
  - "Current split": the new 3-job table, with `pytest_non_views` showing `parallelism` and the split step.
  - "Coverage": the new names in `coverage-final`, plus a note that every container uploads a partial report.
  - "Release jobs": the new names.
  - "Durations report": artifacts are per container, and `test-files.txt` is a new artifact.
  - "Rebalancing (#1788)": replace "Planned by #1788" with what was done. Record the hybrid choice and why it beat the pure path-based split and full parallelism, the chosen `parallelism` value with its reasoning, the fallback to splitting by name on the first run, and `pytest_views_game` as the next split candidate.
- `docs/agents/contributing.md:40`: the `backend/` row lists `pytest_views_game`, `pytest_views_rest`, `pytest_non_views`, `checks`.
- `.claude/agents/infra.md`:
  - The pipeline diagram (around line 109) and the job table (around line 123) still show one `pytest` job with `cimg/mysql:8.0`. Show the 3 jobs with the `parallelism` note and `cimg/mysql:8.4.13`.
  - Check the `wake-navi` and release rows for job names.
- `.claude/agents/backend.md`: it does not name CI jobs today. Only change it if a job name appears there.

## Files to Change

- `docs/agents/specs/pytest-all-long-test/ci-jobs.md`
- `docs/agents/contributing.md`
- `.claude/agents/infra.md`
