# Issue: Backend tests speed: local test ergonomics (reuse-db and tests-fast)

## Description

Part of Epic #1785, which reduces the backend pytest suite runtime (CI first, local runs too). At the start of the Epic, CI was held up by `pytest_all` at 8m 34s (pipeline 5881). #1787, #1788 and #1802 have since split it into the parallel `pytest_views` and `pytest_non_views` jobs; both run pytest through the shared `pytest_with_reports` command in `.circleci/config.yml`.

This sub-issue makes local backend test runs faster: local runs reuse the test database between runs, and a `make tests-fast` target runs the suite without coverage.

## Problem

- `backend/pyproject.toml` (`[tool.pytest.ini_options]`) has no `addopts`, so every local run drops, recreates and migrates `test_majora`. In CI this one-off setup takes about 50s per container (see `baseline.md`).
- There is no short documented command for a fast local run. The `Makefile` `tests` target only opens a shell in `majora_tests`.
- Plain local `pytest` already runs without coverage, because only CI passes `--cov`. The gain from `make tests-fast` therefore comes mostly from `--reuse-db`.
- Every worktree on a machine shares one MySQL container (`majora_mysql` has a fixed `container_name` and the `./docker_volumes/mysql_data` volume), so they all share the same `test_majora` database. A reused database does not pick up migrations. A run from a branch with a different set of migrations would silently use the wrong schema. Agents switch branches all the time and check their work through `.claude/scripts/check_backend.sh`.

## Expected Behavior

- **`addopts`:** `[tool.pytest.ini_options]` gets `addopts = "--reuse-db"`, so a plain local `pytest` (`docker-compose run --rm majora_tests pytest` in `AGENTS.md`, `poetry run pytest` in `README.md`) reuses `test_majora`.
- **CI unchanged:** the `pytest_with_reports` command in `.circleci/config.yml` passes `--create-db` explicitly. pytest-django gives `--create-db` priority over `--reuse-db`, so `pytest_views` and `pytest_non_views` still build a fresh database in every container.
- **Agents unchanged:** `.claude/scripts/check_backend.sh` passes `--create-db` too, so an agent's check always runs against the schema of the branch it is on.
- **`make tests-fast`:** a new target runs `docker-compose run --rm majora_tests poetry run pytest --reuse-db $(ARGS)`. With no `ARGS` it runs the whole suite; `make tests-fast ARGS=accounts/tests` runs a subset. It is added next to the existing `tests` target, which stays as it is. It never passes `--cov`.
- **Documentation:** `AGENTS.md` (Development section) and `README.md` say:
  - local runs reuse `test_majora`;
  - pass `--create-db` (or run `make tests-fast ARGS=--create-db`) after pulling or writing migrations, after switching to a branch with different migrations, and after an interrupted migration test;
  - `make tests-fast` is the fast local command.
- **Existing commands keep working:** `docker-compose run --rm majora_tests pytest`, `.claude/scripts/check_backend.sh`, `poetry run pytest` and `make tests`.
- **Local baseline (before any change):** the PR measures a full local run in the `majora_tests` container, both with and without `--cov`, on a stated machine (host OS, CPU, Docker and MySQL versions), and records both numbers in the "Local" section of `baseline.md`, replacing the #1786 placeholder.
- **After the change:** on the same machine, the PR measures a full `make tests-fast` run with the database already present (the second consecutive run, so it is actually reused). It must be measurably faster than the no-coverage baseline. The number is recorded next to the baseline.
- **Local target:** the "Targets" section of `baseline.md` records that measured after-time as the local target: later sub-issues must not make a full `make tests-fast` run slower.
- A row for #1794 is added to the History table in `baseline.md`.
- `edge-cases.md` (`--reuse-db` section) is updated with the shared-container caveat and the `check_backend.sh` decision.

## Solution

- `backend/pyproject.toml`: `addopts = "--reuse-db"`.
- `.circleci/config.yml`: add `--create-db` to the `poetry run pytest` line of the `pytest_with_reports` command. That one edit covers both pytest jobs.
- `.claude/scripts/check_backend.sh`: `poetry run pytest --create-db`.
- `Makefile`: add `tests-fast` (with an `ARGS ?=` default) to the Development section and to `.PHONY`.
- Docs: `AGENTS.md`, `README.md`, and in `docs/agents/specs/pytest-all-long-test/`: `baseline.md` (Local, Targets, History) and `edge-cases.md` (`--reuse-db`).
- Owners: `backend` (pytest configuration, `check_backend.sh`, measurements) and `infra` (`Makefile`, CI). Depends on #1786, which is merged. It changes no test, so it does not depend on #1789 to #1793.

### Verification (applies to every test or CI change in this Epic)

- `pytest --collect-only -q` lists the same node IDs before and after, except for renames the PR lists explicitly.
- The full suite passes in CI; no test is skipped, marked `xfail` or deleted to get there.
- Codacy total coverage does not drop.
- The PR description reports the before and after time of the affected CI jobs, and the new numbers are added to `baseline.md`. CI should not change for this sub-issue, so the CI numbers are only there to show it.
- The PR description also shows the local before and after numbers, and that a CI pytest container log still creates the test database.
