# Backend Plan: Backend tests speed: autouse memory cache fixture and test-policy check script

Main plan: [plan.md](plan.md)

## Shared contracts

`backend` produces `backend/bin/check_test_policy.py`:

- Run from the backend root with no arguments: `poetry run python bin/check_test_policy.py`.
- Reads `testpaths` from `./pyproject.toml` (`tomllib`).
- Exit `0` = clean (opt-outs printed only), `1` = violations, `2` = configuration error.
- Output lines: `path:line: rule-id: message`; opt-outs as `path:line: rule-id: allowed (opt-out)`.
- Standard library only.

`infra` adds the CI step that runs it in the `checks` job; `backend` does not touch
`.circleci/config.yml`.

## Steps

- [01 — Autouse fixture and manual clears](backend/01-autouse-fixture.md)
- [02 — Test-policy check script](backend/02-check-script.md)
- [03 — Docs](backend/03-docs.md)
- [04 — Verify and record numbers](backend/04-verify-and-record.md)

## CI Checks

- `backend/`: `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_views_game`,
  `pytest_views_rest`, `pytest_non_views`)
- `backend/`: `docker-compose run --rm majora_tests ruff check .` and
  `docker-compose run --rm majora_tests poetry run python bin/check_test_policy.py`
  (CI job: `checks`, which also runs `bin/reports.sh ci` for complexity — keep the script's
  functions small)

## Notes

- Ordering: pytest runs autouse fixtures from the root `conftest.py` before the class-level
  `setup_method` fixture, and Django `setUp` runs inside the test call, so a test that primes the
  cache in its setup still sees its primed values. Cache warmed in `setUpTestData`/`setUpClass` is
  cleared before each test; any test depending on that must build or prime its own state.
- Tests that fail after the change are real bugs in the test (hidden order dependence). Fix them,
  never skip, `xfail` or delete; list each one in the PR and in `edge-cases.md`.
- `staff/tests/staff_cache_clear_test.py` primes the cache in `setup_method` after clearing it:
  remove only the clear, keep the priming.
- Transactional tests (`TransactionTestCase`, migrations) flush or truncate tables, which can reset
  MySQL auto-increment ids; a per-test clear also removes stale cache entries keyed by reused ids.
- `bin/` is outside coverage `source`, so the script does not change Codacy coverage.
