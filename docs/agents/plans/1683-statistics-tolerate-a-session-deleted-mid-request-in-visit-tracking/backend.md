# Backend Plan: Statistics: tolerate a session deleted mid-request in visit tracking

Issue: [1683-statistics-tolerate-a-session-deleted-mid-request-in-visit-tracking.md](../../issues/1683-statistics-tolerate-a-session-deleted-mid-request-in-visit-tracking.md)

## Overview

Two middleware writes return a 500 when the request's statistics `Session` was deleted after
being loaded:

- `StatisticsSessionMiddleware._touch_session` — `session.save(update_fields=['last_seen_at'])`
  raises `DatabaseError("Save with update_fields did not affect any rows.")`.
- `visit_tracking.track_visit` — `Visit.objects.create(session=...)` raises `IntegrityError`
  (MySQL/InnoDB checks the foreign key immediately; the test suite also runs on MySQL).

Fix each one where it happens, add regression tests for every point (including
`attach_user`, which already rotates to a new session), and sync the tracking-race spec.

## Context

- The Clear endpoint (#1684) deletes every `Session` and `Visit`; it depends on this issue.
- Spec: `docs/agents/specs/statistics_dashboard/tracking-race.md`.
- `attach_user`'s in-place `UPDATE ... WHERE user_id IS NULL` matches 0 rows for a deleted
  session and falls through to `Session.objects.create(...)`; the always-rotate path creates a
  new row directly. Neither touches the deleted row, so no code change is needed there.
- Skipped writes are **not** logged (decided in the issue).

## Steps

- [01 — Make the session touch a no-op on a deleted row](backend/01-touch-session-update.md)
- [02 — Skip the visit for a deleted session](backend/02-track-visit-savepoint.md)
- [03 — Middleware and attachment regression tests](backend/03-middleware-regression-tests.md)
- [04 — Sync the tracking-race spec](backend/04-sync-tracking-race-spec.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest statistics accounts` (CI jobs:
  `pytest_all`, `pytest_views_*`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` and
  `docker-compose run --rm majora_tests bin/reports.sh ci` (CI job: `checks`)
- `docs`: `docker-compose run --rm markdownlint yarn lint_md` (CI job: `markdownlint`)

## Notes

- The savepoint (`transaction.atomic()`) around the `Visit` insert is required, not cosmetic:
  without it a caught `IntegrityError` leaves the enclosing transaction (pytest's test
  transaction today, `ATOMIC_REQUESTS` if ever enabled) unusable and later queries fail with
  `TransactionManagementError`.
- Catch only `IntegrityError` around the insert — do not widen to `DatabaseError`, so unrelated
  DB failures still surface.
- The normal path must not change: all existing `middleware_test.py`, `visit_tracking_test.py`
  and `session_attachment_test.py` tests pass unmodified.
- Out of scope: the Clear endpoint (#1684), excluding dashboard requests from tracking, navi /
  cache / permissions (no endpoint is added).
