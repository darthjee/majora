# Backend Plan: Statistics bug: return the session tracking columns in the staff statistics API (backend)

Main plan: [plan.md](plan.md)

## Overview

Add the #1712 tracking columns to two existing read-only staff endpoints by extending their
serializers only: `GET staff/statistics/export.json` and `GET staff/statistics/visit-list.json`.
No model, migration, view, filter, sort or access change.

## Context

- #1712 (merged) added `Session.first_path` (`CharField(255)`, null), `Session.creation_reason`
  (`Session.CreationReason` choices, null), `Session.first_seen_logged` (boolean, null),
  `Visit.first_path` and `Visit.last_path` (`CharField(255)`, null). Paths hold route patterns
  (or `unresolved`), never raw paths. Legacy rows are `NULL`.
- Export: `StaffStatisticsExportSessionSerializer` (sessions, `select_related('domain')`) and
  `StaffStatisticsExportVisitSerializer` (visits batched by `SessionExportVisits`).
- Visit list: `StaffStatisticsVisitSerializer`, flat rows (`session_id`, `ip`, `domain` read
  from `visit.session`); `VisitList` already does `select_related('session__user__profile',
  'session__domain')`, so session columns come from the joined row.
- Agreed contract (issue): export sessions gain `first_path`, `first_seen_logged`,
  `creation_reason`; export visits gain `first_path`, `last_path`; visit-list rows gain
  `first_path`, `last_path` (the visit's) and `session_first_path`, `session_creation_reason`,
  `session_first_seen_logged`. `creation_reason` is the raw stored value, no labels. `null`
  stays `null`.

## Steps

- [01 — Export payload](backend/01-export-payload.md)
- [02 — Visit list payload](backend/02-visit-list-payload.md)
- [03 — Docs](backend/03-docs.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI job: backend tests)
- `backend`: `docker-compose run --rm majora_tests ruff check .` (CI job: backend lint)
- docs: `docker-compose run --rm markdownlint` (CI job: markdown lint)

## Notes

- Append the new fields at the end of each serializer's `fields` list so existing key order is
  kept; update the exact-key tests (`SESSION_KEYS`, `VISIT_KEYS`, `ROW_KEYS`) and full-row
  assertions accordingly.
- Query counts must not change: keep the existing query-count tests green and do not add
  `select_related`/`prefetch_related` or per-row lookups.
- Never expose the session token; the existing `token`-absence tests stay unchanged.
- Test data in this public repo uses documentation IPs and fake values only.
- data-access review: payload change on staff endpoints (no new data beyond route patterns and
  enum values).
