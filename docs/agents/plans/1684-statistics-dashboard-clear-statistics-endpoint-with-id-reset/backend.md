# Backend Plan: Statistics dashboard: clear statistics endpoint with ID reset

Issue: [1684-statistics-dashboard-clear-statistics-endpoint-with-id-reset.md](../../issues/1684-statistics-dashboard-clear-statistics-endpoint-with-id-reset.md)

## Overview

Add `DELETE staff/statistics.json`. It deletes all `statistics_visit` and
`statistics_session` rows in batches, resets both tables' `AUTO_INCREMENT` to `1`, and
returns `200 {"deleted_visits": n, "deleted_sessions": n}`. Every run writes one
`staff_statistics_clear` audit line. All MySQL-specific SQL goes in a new
`backend/statistics/reset.py`.

## Context

- Spec: `docs/agents/specs/statistics_dashboard/clear-endpoint.md`. It is the detailed
  reference for the algorithm, the audit-log format and the tests. The issue settles the one
  point the spec left open: a `StatisticsReset` object carries the partial counts.
- Dependencies #1680, #1681 and #1683 are merged. Since #1683, the middleware tolerates a
  session that is deleted mid-request.
- Pattern to follow for the view: `backend/staff/views/staff_cache_clear.py` (`@restricted`,
  `DELETE`, `AllowAny` and `require_staff` inline). Pattern for the audit line:
  `log_api_token_action` in `backend/staff/views/_api_token_shared.py`.
- `Visit.session` is `on_delete=CASCADE`, but Django runs that cascade in Python. Raw SQL
  skips it.
- Tests are pytest-style. "`TransactionTestCase`" means
  `@pytest.mark.django_db(transaction=True)`, because `ALTER TABLE` commits implicitly and
  cannot run inside the test transaction. The test DB is MySQL.

## Steps

- [01 — Batch-size setting and the reset helper](backend/01-reset-helper.md)
- [02 — The clear view, route and audit log](backend/02-clear-view.md)
- [03 — Tests](backend/03-tests.md)
- [04 — Access-control doc](backend/04-access-control-doc.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest statistics staff` (CI job:
  `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` and
  `docker-compose run --rm majora_tests bin/reports.sh ci` (CI job: `checks`)
- `docs`: `docker-compose run --rm markdownlint yarn lint_md` (CI job: `markdownlint`)

## Notes

- Do not use `TRUNCATE`, turn off `FOREIGN_KEY_CHECKS` or use `atomic()` in `reset.py`.
  Each batch autocommits.
- Table names: use `Visit._meta.db_table` / `Session._meta.db_table` rather than hard-coding
  the strings, and quote them with `connection.ops.quote_name`.
- No navi, proxy, or cache-warmer changes: the endpoint is proxied but not cached.
  `@restricted` sets `X-Skip-Cache`.
- No API-token scope declaration is needed: `staff/` is in `EXCLUDED_ROUTE_PREFIXES`.
- Reviewers: the security, data-access and cache agents.
- Out of scope: the frontend card (#1685), a persisted audit model, rate limiting, and removing
  the specs (#1686).
