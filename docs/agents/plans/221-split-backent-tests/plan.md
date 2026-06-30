# Plan: Split Backend Tests

Issue: [221-split-backent-tests.md](../issues/221-split-backent-tests.md)

## Overview

Split the single `pytest` CircleCI job into two parallel jobs (`pytest_views` and `pytest_all`) so that view tests and non-view tests run concurrently, reducing total CI wall time. Update all downstream jobs that currently depend on `pytest` to depend on both new jobs.

## Context

The current `pytest` job runs all backend tests sequentially with:
```
poetry run pytest --cov --cov-report=lcov:coverage/lcov.info
```
It also copies source files with `cp source/* ./ -r` before running. The issue requests:
- `pytest_views` — only `games/tests/views/`
- `pytest_all` — all tests except `games/tests/views/` (via `--ignore=games/tests/views/`)
- Both jobs use `cd source` (working_directory approach) instead of the file-copy pattern
- Both jobs upload partial coverage to Codacy
- All jobs that require `pytest` are updated to require `[pytest_views, pytest_all]`

## Implementation Steps

### Step 1 — Add two new pytest jobs

In `.circleci/config.yml`, under the `jobs:` section, add two new job definitions modeled after the existing `pytest` job but with the following differences:

**`pytest_views`:**
- Use `working_directory: ~/project/source` (or add a `cd source &&` prefix to commands) instead of the `cp source/* ./ -r` step
- Run: `poetry run pytest games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info`
- Upload partial coverage to Codacy (same as current `pytest` job)

**`pytest_all`:**
- Same working directory approach
- Run: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info`
- Upload partial coverage to Codacy

Both jobs keep the same Docker images (backend image + MySQL sidecar) and environment variables as the current `pytest` job.

### Step 2 — Add the two new jobs to the workflow

In the `test` workflow, add entries for `pytest_views` and `pytest_all` with the same `filters` and `requires` as the current `pytest` job (i.e., `requires: [release-circleci_majora-base, release-circleci_majora-base-arm64]`).

### Step 3 — Update downstream job dependencies

Replace `pytest` with `pytest_views, pytest_all` in the `requires` list of every job that currently depends on `pytest`:

- `coverage-final`: `requires: [pytest, jasmine]` → `requires: [pytest_views, pytest_all, jasmine]`
- `build-and-release`: replace `pytest` with `pytest_views, pytest_all`
- `upload_proxy_files`: replace `pytest` with `pytest_views, pytest_all`
- `upload_fe_files`: replace `pytest` with `pytest_views, pytest_all`
- `link_photos`: replace `pytest` with `pytest_views, pytest_all`
- `upload_admin_assets`: replace `pytest` with `pytest_views, pytest_all`

### Step 4 — Remove the old pytest job

Remove the `pytest` job definition from `jobs:` and remove it from the workflow entirely (it has been replaced by the two new jobs).

## Files to Change

- `.circleci/config.yml` — add `pytest_views` and `pytest_all` jobs, update workflow entries and all `requires:` references

## CI Checks

- `.circleci/`: validated by CircleCI when the PR is pushed (CI job: `pytest_views`, `pytest_all`, `checks`)

## Notes

- The issue uses `cd source` phrasing; in CircleCI the cleanest way is to set `working_directory: ~/project/source` at the job level (if the Docker executor supports it) or prepend `cd source &&` to each `run` command. Prefer `working_directory` if the checkout step still runs in the default directory.
- Coverage for both jobs is uploaded as partial; Codacy merges them via the existing `coverage-final` job.
- The old `pytest` job can be deleted once both new jobs are wired up and passing.
