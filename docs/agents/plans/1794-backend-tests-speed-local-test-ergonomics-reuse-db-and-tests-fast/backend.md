# Backend Plan: Backend tests speed: local test ergonomics (reuse-db and tests-fast)

Main plan: [plan.md](plan.md)

## Shared contracts

- Rely on infra's `make tests-fast` (`docker-compose run --rm majora_tests poetry run pytest --reuse-db $(ARGS)`,
  `ARGS` empty by default) and on infra adding `--create-db` to the CI `pytest_with_reports` command.
- Produce `addopts = "--reuse-db"` in `backend/pyproject.toml`.
- Step 01 runs on the unchanged tree, before infra or backend edit anything.

## Steps

- [01 — Measure the local baseline](backend/01-measure-local-baseline.md)
- [02 — Enable reuse-db locally, keep agent checks fresh](backend/02-enable-reuse-db.md)
- [03 — Measure after, record the target and update the docs](backend/03-measure-after-and-docs.md)

## CI Checks

- `backend/`: `docker-compose run --rm majora_tests poetry run pytest --create-db` and
  `docker-compose run --rm majora_tests poetry run ruff check .` (`.claude/scripts/check_backend.sh`;
  CI jobs `pytest_views`, `pytest_non_views`, `checks`).
- Docs: `markdownlint` CI job.

## Notes

- All worktrees share the `majora_mysql` container and its `test_majora` database. Do not run
  measurements while another worktree is running tests, or the numbers (and the runs) will
  interfere. If the `majora_mysql` container belongs to another worktree, reuse it; do not remove it.
- Run everything through `docker-compose`; never run `pytest` or `poetry` on the host.
