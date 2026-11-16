# Infra Plan: Backend tests speed: local test ergonomics (reuse-db and tests-fast)

Main plan: [plan.md](plan.md)

## Shared contracts

- Produce `make tests-fast`: `docker-compose run --rm majora_tests poetry run pytest --reuse-db $(ARGS)`,
  with `ARGS ?=` (empty default), added to `.PHONY` and placed in the Development section next to
  `tests`. Never passes `--cov`.
- Produce `--create-db` in the CI pytest command, so CI behaviour does not change once backend adds
  `addopts = "--reuse-db"`.
- Do not edit anything before backend has taken its baseline measurement (backend step 01).

## Implementation Steps

### Step 1 — Add `make tests-fast`

Add `ARGS ?=` and a `tests-fast` target to the `Makefile` Development section, right after
`tests`. Add `tests-fast` to `.PHONY`. Keep `tests` unchanged. Check that
`make tests-fast ARGS=common/tests` runs only that folder and that `make tests-fast` with no
`ARGS` collects the whole suite (`make tests-fast ARGS=--collect-only -q` is enough for the
collection check).

### Step 2 — Keep CI on a fresh database

In `.circleci/config.yml`, in the `pytest_with_reports` command, change
`poetry run pytest << parameters.paths >> --cov ...` to pass `--create-db` too (for example right
after `<< parameters.paths >>`). Update the comment above the command to say why (`addopts` has
`--reuse-db` since #1794; CI always creates the database). This single command covers
`pytest_views` and `pytest_non_views`. Confirm in the PR pipeline that each pytest container
still logs the test database creation (about 40–50s on the first test's setup) and that the
test counts are unchanged.

## Files to Change

- `Makefile` — `ARGS ?=`, `tests-fast` target, `.PHONY`.
- `.circleci/config.yml` — `--create-db` in `pytest_with_reports`, comment.

## CI Checks

- `.circleci/config.yml`: validated by the PR pipeline itself (jobs `pytest_views`,
  `pytest_non_views`, `coverage-final`).

## Notes

- `.claude/agents/infra.md` lists Makefile targets only if it has such a table; if it does, add
  `tests-fast` there.
