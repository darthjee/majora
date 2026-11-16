# Post the final numbers on the Epic

Collect the Epic's before and after runtimes and post them as one comment on #1785 (`gh issue comment 1785 --body-file ...`). Put the same table in the PR description.

| Measure | Before | After |
|---------|--------|-------|
| CI `test` workflow | 8m 43s (pipeline 5881) | latest `main` pipeline |
| CI pytest jobs | `pytest_all` 8m 34s, `pytest_views_characters` 5m 04s, `pytest_views_rest` 3m 35s | `pytest_views`, `pytest_non_views` (slowest container and total) |
| Local full run, no `--cov` | 2m 01s (113.85s pytest) | fresh `make tests-fast`, second consecutive run |
| Local full run, `--cov` | 3m 19s (191.82s pytest) | optional: `pytest --cov` on the same machine |

- CI "after": job durations from the CircleCI API or UI for the latest green `main` pipeline; name the pipeline number.
- Local "after": same machine as the #1794 baseline (Apple M4 Pro, 24 GB, Docker 29.3.0, MySQL 8.4.13); state it, or state the different machine.
- Do not backfill the pending #1790 / #1792 rows in `baseline.md`; the file is deleted in step 02.
- Mention that module conversions were dropped from the Epic and remain future, measured, one-module-per-PR work under `docs/agents/testing.md`.

## Files to Change

- None in the repo: a GitHub comment on #1785 and the PR description.
