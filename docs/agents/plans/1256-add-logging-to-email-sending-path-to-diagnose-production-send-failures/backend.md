# Backend Plan: Add logging to email-sending path to diagnose production send failures

Main plan: [plan.md](plan.md)

## Steps

- [01 — Add a Django LOGGING config](backend/01-add-logging-config.md)
- [02 — Instrument `_send_email`](backend/02-instrument-send-email.md)
- [03 — Extend tests with log assertions](backend/03-extend-tests.md)

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- This work has already been implemented and committed on branch `issue-1256`
  (commit `3ff69622`) prior to this plan being written; the full backend test
  suite (5506 tests) passes and `ruff` is clean. This plan documents the
  approach taken, for the record and for anyone reviewing/reproducing it.
- `send_password_reset_email` (`backend/accounts/views/password_reset/_shared.py`)
  needed no direct changes — it already funnels through the same instrumented
  `_send_email`, so it's covered without a separate logger.
