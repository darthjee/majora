# Enable reuse-db locally, keep agent checks fresh

- In `backend/pyproject.toml`, `[tool.pytest.ini_options]`, add `addopts = "--reuse-db"`, so a plain
  local `pytest` (`docker-compose run --rm majora_tests pytest`, `poetry run pytest`) reuses
  `test_majora`.
- In `.claude/scripts/check_backend.sh`, change the pytest line to
  `docker-compose run --rm majora_tests poetry run pytest --create-db`, so an agent's check always
  runs against the schema of its own branch (every worktree shares one MySQL container).
- Check that `pytest --collect-only -q` in the container lists the same node IDs as in step 01.

## Files to Change

- `backend/pyproject.toml` — `addopts = "--reuse-db"`.
- `.claude/scripts/check_backend.sh` — `--create-db`.
