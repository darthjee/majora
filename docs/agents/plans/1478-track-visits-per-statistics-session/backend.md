# Backend Plan: Track visits per statistics session

Main plan: [plan.md](plan.md)

## Overview

All work lives in `backend/statistics/` plus two docs. `Session` stays the visitor identity;
a new `Visit` record carries activity. No API endpoint, serializer or proxy/cache change.

## Context

- `StatisticsSessionMiddleware._load_or_create_session` currently runs
  `session.save(update_fields=['last_seen_at'])` on every reused session; `last_seen_at` is
  `auto_now=True`.
- `_backfill_user` rotates a pre-existing anonymous session via `attach_user(...,
  always_rotate=True)`, or attaches in place when the session was created in the same request.
- Settings follow the `statistics.settings.Settings` static-method pattern using `env_int`.
- Decisions settled in the issue: exact `hits` (single atomic `UPDATE`), `Session.last_seen_at`
  throttled (~60s), visits are **not** moved on login rotation, no backfill.

## Steps

- [01 — Visit model, migration and admin](backend/01-visit-model.md)
- [02 — Settings for window and throttle](backend/02-settings.md)
- [03 — Middleware: track visits and throttle Session writes](backend/03-middleware.md)
- [04 — Tests](backend/04-tests.md)
- [05 — Docs: spec and access-control page](backend/05-docs.md)

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all`), run via
  `docker-compose` / `make tests`
- `backend`: `poetry run ruff check .` and `bin/reports.sh ci` (CI job: `checks`)
- `docs`: `yarn lint_md` (CI job: `markdownlint`)

## Notes

- Concurrent requests right after the window expires may both open a visit; accepted, no lock.
- The existing test `test_reuses_session_when_cookie_ip_matches` asserts `last_seen_at`
  advances on every request; it must be adapted to the throttle (make the session stale first,
  and add a counterpart asserting no write when fresh).
- No time-freezing library is installed; age rows in tests with
  `Model.objects.filter(pk=...).update(last_seen_at=...)` rather than adding a dependency.
- No new API surface, so no `cache` (navi) or `X-Skip-Cache` work.
