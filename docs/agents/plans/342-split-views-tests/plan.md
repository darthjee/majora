# Plan: Split views tests

Issue: [342-split-views-tests.md](../issues/342-split-views-tests.md)

## Overview

Replace the single `pytest_views` CircleCI job with two parallel jobs —
`pytest_views_characters` and `pytest_views_rest` — splitting `games/tests/views/` by the
`characters/` subdirectory. This mirrors the existing `--ignore` pattern already used by
`pytest_all` and brings the split close to an even 47/53 test distribution, reducing the
wall-clock time of the slowest job in the pipeline.

## Context

`source/games/tests/views/` currently holds:
- `characters/` — all `/games/:game_slug/pcs...` and `/games/:game_slug/npcs...` endpoint
  tests (251 tests)
- `games/`, `game_masters/`, `game_sessions/`, `staff/`, `treasures/`, plus the root-level
  files (`upload_finalize_test.py`, `common_test.py`, `health_test.py`,
  `photo_upload_test.py`) — everything else (278 tests)

The current `pytest_views` job in `.circleci/config.yml` runs the whole
`games/tests/views/` directory in a single job (`poetry run pytest games/tests/views/ --cov
--cov-report=lcov:coverage/lcov.info`), making it the slowest job in the pipeline.

## Implementation Steps

### Step 1 — Rename/replace `pytest_views` with `pytest_views_characters`

In `.circleci/config.yml`, replace the `pytest_views` job definition with
`pytest_views_characters`, keeping the same Docker images, environment variables, working
directory, and steps, but changing the `Tests` step command to:

```
poetry run pytest games/tests/views/characters/ --cov --cov-report=lcov:coverage/lcov.info
```

### Step 2 — Add `pytest_views_rest` job

Add a new job `pytest_views_rest`, identical in shape (same images, env vars, working
directory, Poetry install, migrate step) to `pytest_views_characters`, but with the `Tests`
step command:

```
poetry run pytest games/tests/views/ --ignore=games/tests/views/characters/ --cov --cov-report=lcov:coverage/lcov.info
```

### Step 3 — Update the workflow graph

In the `workflows.test.jobs` list of `.circleci/config.yml`:
- Replace the `pytest_views` workflow entry with two entries, `pytest_views_characters` and
  `pytest_views_rest`, each keeping the same `filters: *all_tags` and
  `requires: [release-circleci_majora-base, release-circleci_majora-base-arm64]` as the
  original `pytest_views` entry.
- Update every `requires` list currently containing `pytest_views` to instead list both
  `pytest_views_characters` and `pytest_views_rest`. This affects:
  - `coverage-final`
  - `build-and-release`
  - `upload_proxy_files`
  - `upload_fe_files`
  - `link_photos`
  - `upload_admin_assets`

### Step 4 — Verify no other references remain

Search the repo for any other reference to the `pytest_views` job name (e.g. status checks,
branch protection docs, other CI config) and update them if found. If none are found outside
`.circleci/config.yml`, no further action is needed.

## Files to Change

- `.circleci/config.yml` — split the `pytest_views` job into `pytest_views_characters` and
  `pytest_views_rest`, and update every `requires` list that referenced `pytest_views`

## CI Checks

- `.circleci`: no local command runs CircleCI workflows directly; validate by pushing the
  branch and confirming both new jobs (`pytest_views_characters`, `pytest_views_rest`) run
  and pass in the CircleCI pipeline (job: `pytest_views_characters`, `pytest_views_rest`)
- `source`: `docker-compose run backend poetry run pytest games/tests/views/characters/ --cov` and
  `docker-compose run backend poetry run pytest games/tests/views/ --ignore=games/tests/views/characters/ --cov`
  can be run locally (through the appropriate `docker-compose` service) to confirm both new
  test splits pass before pushing, mirroring what CI will run

## Notes

- This is a CI-configuration-only change; no application code under `source/` or
  `frontend/` needs to change.
- No new API endpoints, serializer fields, or permission logic are introduced, so the
  `data-access` and `security` review steps are not required for this issue.
- Double-check the final even split roughly matches the issue's stated 251/278 test count
  after the change lands, to confirm no test file was miscategorized.
