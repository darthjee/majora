# Issue: Backend — crawler debug harness summary + clear endpoints

## Description

Sub-issue of the parent tracking issue #1260 (Lootstudios STL Crawler) and part
of the temporary crawler emission debug harness specified in
`docs/agents/specs/crawler-test-harness.md`.

Siblings:

- **#1273 — Backend: `/staff/crawler.json` record create/list** (merged). Built
  the `CrawlerDebugEmission` model (in the `staff` app), its migration, the
  `staff_crawler` view (`GET`/`POST` on `staff/crawler.json`), and the cursor
  paginator.
- **#1274 — Frontend: `/#/staff/crawler` two-column record-browsing page**
  (merged). Consumes #1273's `GET`; not a consumer of this issue's endpoints.
- **#1276 — Frontend: `/#/staff/dashboard` crawler debug card** (the consumer
  of this issue's work). A lightweight card on the existing staff dashboard
  showing the per-`type` counts plus a confirm-then-clear button, mirroring the
  existing `MemoryCacheCard`.

The `CrawlerDebugEmission` model already exists — no model or migration changes
are needed here.

## Problem

Once a crawler run has POSTed a batch of debug records, staff need a quick way
to see how many were captured (broken down by `type`) and to clear the table
out between test runs — without opening the full `/#/staff/crawler`
record-browsing page. No endpoint currently exposes entry counts or a blanket
clear of the table.

## Expected Behavior

- `GET /staff/crawler/summary.json` — staff/superuser only. Returns entry
  counts grouped by `type`, e.g. `{"stl_model": 42, "collection": 7}`. Returns
  `{}` when the table is empty. `type` is a free-text `CharField` (no choices),
  so every distinct value present in the table is reported — there is no
  whitelist of expected types.
- `DELETE /staff/crawler.json` — staff/superuser only. Deletes every row in the
  `CrawlerDebugEmission` table (a blanket clear — not scoped by `type` or
  `source`). Returns `204`, matching `staff_cache_clear`'s convention.
- Both endpoints enforce staff-or-superuser inline via `require_staff`
  (`401` for anonymous, `403` for authenticated non-staff), and both set
  `X-Skip-Cache: true` via `@restricted`, matching every other `staff/*`
  endpoint.

## Solution

Follows the existing, exact precedent in this codebase —
`backend/staff/views/staff_cache_clear.py` + `staff_cache_summary.py` (the
process-wide memory-cache clear/summary pair). Decorator order on every new
view: `@restricted` outermost, then `@api_view([...])`, then
`@permission_classes([AllowAny])`, then an inline `require_staff` guard.

**Summary endpoint**

- New standalone view `staff_crawler_summary` in its own file, mirroring
  `staff_cache_summary` — a thin passthrough. Re-export it from
  `backend/staff/views/__init__.py` and register it on a new route
  `staff/crawler/summary.json` (`name='staff-crawler-summary'`) in
  `backend/staff/urls.py`, paralleling `staff/cache/summary.json`.
- The aggregation + reshaping lives in a dedicated builder class (e.g.
  `CrawlerDebugEmissionSummary`, alongside
  `backend/staff/crawler_debug_emission_paginator.py`), not inline in the view:
  `CrawlerDebugEmission.objects.values('type').order_by().annotate(count=Count('id'))`
  reshaped into the `{type: count}` dict. No serializer — same rationale as
  `staff_crawler` (the model is temporary).

**Clear endpoint**

- New standalone view `staff_crawler_clear` in its own file, mirroring
  `staff_cache_clear` as closely as possible (`CrawlerDebugEmission.objects.all().delete()`
  then `Response(status=204)`). Re-export it from
  `backend/staff/views/__init__.py` and cover it with its own tests.
- Routing nuance: Django resolves a single view per URL string, so a second
  `path('staff/crawler.json', ...)` entry would be unreachable.
  `staff/crawler.json` therefore keeps resolving to the existing `staff_crawler`
  view; extend that view's `@api_view` list to `['GET', 'POST', 'DELETE']` and
  have its `DELETE` branch delegate to `staff_crawler_clear(request)`. This
  keeps `staff_crawler_clear` a separate, independently testable/re-exported
  view function while still serving `DELETE /staff/crawler.json`.

**Docs**

- Extend `docs/agents/access-control/staff-crawler.md`: add table rows for
  `GET /staff/crawler/summary.json` and `DELETE /staff/crawler.json` (both
  **Staff-or-superuser**), and update the "Both `POST` and `GET`" prose to
  cover the new methods.
- No new row in `docs/agents/access-control/endpoints.md` — the staff-cache
  pair is not listed there either; the dedicated `staff-crawler.md` file is the
  documented home.

### Acceptance criteria

- [ ] `GET /staff/crawler/summary.json` returns per-`type` entry counts
      (`{}` when empty), staff/superuser only.
- [ ] `DELETE /staff/crawler.json` clears the entire `CrawlerDebugEmission`
      table, staff/superuser only, returns `204`.
- [ ] Both follow the `require_staff` + `@restricted` pattern
      (`X-Skip-Cache: true`) and are documented in
      `docs/agents/access-control/staff-crawler.md` alongside the sibling
      record create/list endpoints.
- [ ] Per-`type` grouping/reshaping lives in a dedicated builder class, not
      inline in the view.
- [ ] Tests cover: summary grouping correctness (including the empty-table
      case), clearing (and that it does not affect rows in any other table),
      and the staff-only access check (`401`/`403`) plus the `X-Skip-Cache`
      header on both endpoints. Add `DELETE` cases to the existing
      `staff_crawler_test.py` and a dedicated test class/file for the summary
      view.

## Out of scope

- #1273's `POST`/`GET` record create/list endpoints (merged).
- The `/#/staff/dashboard` crawler debug card (#1276, frontend sibling).
- Scoping the `DELETE` clear to a specific `type`/`source` — blanket clear
  only, for now.

## Benefits

- Staff can gauge at a glance what a crawler run emitted (per-`type` counts)
  and reset the table between runs without paging through the full record
  browser.
- Reuses the exact `staff_cache_clear` / `staff_cache_summary` precedent,
  keeping the temporary harness consistent and cheap to delete wholesale once
  #1262's real import endpoint is trusted end-to-end.

Owned by: `backend`.
