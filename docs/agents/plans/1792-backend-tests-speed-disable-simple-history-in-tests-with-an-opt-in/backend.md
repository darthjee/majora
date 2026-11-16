# Backend plan: disable simple_history in tests with an opt-in (#1792)

## Goal

Under `majora_project.settings_test`, `django-simple-history` (3.13.0) records no history rows
by default. A `@pytest.mark.history` marker turns recording back on for a single test or class
and restores the disabled state afterwards. Production settings and `HistoryRequestMiddleware`
are untouched.

## Steps

1. [backend/01-settings-and-marker.md](backend/01-settings-and-marker.md): test settings flag,
   marker registration, autouse fixture, and tests for the mechanism.
2. [backend/02-apply-marker.md](backend/02-apply-marker.md): mark the tests that read
   `simple_history` rows; leave the `GameDocumentPageHistory` tests alone.
3. [backend/03-docs-and-verify.md](backend/03-docs-and-verify.md): spec docs, collection
   check, full suite, timings.

## Files touched

- `backend/majora_project/settings_test.py`
- `backend/pyproject.toml` (`markers`)
- `backend/conftest.py`
- `backend/common/tests/history_settings_test.py` (new)
- The test files listed in step 2
- `docs/agents/specs/pytest-all-long-test/cost-drivers.md`, `isolation-policy.md`, `baseline.md`

No application code changes.

## Constraints

- All commands go through `docker-compose run --rm majora_tests ...`; never run Python on the host.
- No test may be skipped, `xfail`ed or deleted. `pytest --collect-only -q` keeps the same node IDs,
  plus the new mechanism tests.
