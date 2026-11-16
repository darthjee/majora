# Plan: Backend tests speed: local test ergonomics (reuse-db and tests-fast)

Issue: [1794-backend-tests-speed-local-test-ergonomics-reuse-db-and-tests-fast.md](../../issues/1794-backend-tests-speed-local-test-ergonomics-reuse-db-and-tests-fast.md)

## Overview

Make local backend test runs faster by reusing `test_majora` between runs. `--reuse-db` goes into
pytest's `addopts`, while CI and `.claude/scripts/check_backend.sh` pass `--create-db`, so they
still build a fresh database (all worktrees share one `majora_mysql` container, so a reused
database can carry another branch's schema). A `make tests-fast` target is the documented fast
local command. The PR measures the local run before and after, and records the numbers and the
local target in `baseline.md`. No test changes.

## Agents involved

- [infra](infra.md)
- [backend](backend.md)

## Shared contracts

- **`make tests-fast`** (infra produces, backend measures and documents it):
  - Command: `docker-compose run --rm majora_tests poetry run pytest --reuse-db $(ARGS)`.
  - `ARGS ?=` defaults to empty (the whole suite). Example: `make tests-fast ARGS=accounts/tests`;
    `make tests-fast ARGS=--create-db` rebuilds the database.
  - Never passes `--cov`. Listed in `.PHONY`, placed in the Development section next to `tests`.
- **`--create-db` in CI** (infra): appended to the `poetry run pytest` line of the
  `pytest_with_reports` command in `.circleci/config.yml`, so both `pytest_views` and
  `pytest_non_views` keep creating a fresh test database. pytest-django gives `--create-db`
  priority over `--reuse-db`.
- **`addopts = "--reuse-db"`** in `backend/pyproject.toml` `[tool.pytest.ini_options]` (backend).
- **Ordering:** backend's baseline measurement (backend step 01) runs on the unchanged tree,
  before any file in this plan is edited.
