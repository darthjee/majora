# Issue: Spec: access statistics Overview tab

## Description

Spec-only sub-issue of #1477 (no code). Fill in the **Overview tab** spec page,
`docs/agents/specs/access-statistics/overview.md` (currently a `stub`), and create its
implementation sub-issue(s) under #1477.

The Overview tab is the landing page of the staff access statistics page
(`/staff/statistics`, route name `staffStatistics`): a row of KPI tiles for the selected range,
each linking to the tab that breaks it down. Tiles are plain Bootstrap cards (no Recharts).

Context already settled elsewhere (do not re-decide here):

- [Data model](docs/agents/specs/access-statistics/data-model.md): `Session` is the visitor,
  `Visit` (#1478) is the activity (30-minute inactivity window); visitor key = `user_id` when
  the session has a user, otherwise the session id; no backfill; #1480 is fixed.
- [Shared infrastructure](docs/agents/specs/access-statistics/shared-infrastructure.md)
  (#1482): filter bar (range, user, domain, audience, granularity) kept in the URL; endpoints
  are `GET staff/statistics/<name>.json` following `staff_cache_summary`; non-paginated
  envelope `{filters, buckets, totals}`; Python aggregator package
  (`StatisticsFilters`, `VisitQuery`, `BucketCalendar`, `Series`, `metrics`); 366-day range
  cap; browser time zone.

### Decided in discussion

- **New vs returning** is based on the visitor's **first visit ever**: a visitor key is
  *new* when its earliest `Visit` falls inside the range, and *returning* when it also has a
  `Visit` before the range start. This needs a lookup of earlier visits beyond the range
  (through the ORM, e.g. the visitor keys with a `Visit` before `start_utc`). Since there is
  no backfill, ranges near the deploy date show almost every visitor as new; the spec notes
  this caveat.
- **Previous-period comparison** is **deferred**: not in the first version, listed as a
  deferred open question in `overview.md`.
- **Endpoint:** a dedicated `GET /staff/statistics/overview.json` returning the standard
  envelope with `totals` only (no `buckets`), computed from one `VisitQuery` pass with the
  shared `metrics` helpers (plus the earlier-visits lookup for new vs returning). One request
  for the landing page; it does not call the other tabs' endpoints.
- **Implementation split:** a **backend + frontend pair** of sub-issues, matching
  #1498/#1499: the endpoint first, then the tab (which needs the endpoint).

## Problem

`overview.md` only has placeholders for Metrics, Filters, Chart and layout, API and Edge
cases, plus an open question on comparing with the previous period. Without exact KPI
definitions (in terms of `Visit` and the visitor key) and an endpoint decision, the Overview
implementation sub-issue(s) cannot be written.

## Expected Behavior

`overview.md` is promoted from `stub` to `specced` and defines:

- **Metrics:** the exact definition, for the selected range and filters, of each KPI tile:
  visits, unique visitors, logged-in users, average visit duration, new vs returning
  visitors. Empty-range values (e.g. average duration with no visits) are specified.
- **Previous-period comparison:** recorded as deferred.
- **Filters:** which shared filters apply (granularity is likely irrelevant for tiles with no
  time series) and how the tab handles them.
- **Layout:** tile order and grid, and the tab each tile links to (carrying the current
  filter query).
- **API:** `GET /staff/statistics/overview.json`: its `totals` keys and value types, and
  the queries behind them (one `VisitQuery` pass plus the earlier-visits lookup).
- **Edge cases:** e.g. ranges before visit data exists (no backfill), the user filter
  combined with the logged-in-users tile, and the audience filter combined with new vs
  returning.

Remaining open questions are resolved or listed as deferred.

## Solution

1. Fill in `docs/agents/specs/access-statistics/overview.md` against the conventions in
   `shared-infrastructure.md` and `data-model.md`, and set its status to `specced` (also on
   the hub page list).
2. Create **two** implementation sub-issues under #1477, referencing the spec page:
   - backend: the `overview.json` endpoint (needs #1498);
   - frontend: the Overview tab with its KPI tiles (needs #1499 and the backend
     sub-issue).
3. Note in each implementation sub-issue that the Overview tab is implemented **last**,
   after the other tabs whose aggregations it reuses.
4. Append the created sub-issue numbers to the sub-issue map in
   `docs/agents/specs/access-statistics.md` and to the "Implementation sub-issues" section of
   `overview.md`.

Documentation only: no code changes.

### Dependencies

- Blocked by #1481 (spec init) and #1482 (shared-infrastructure spec), both done.

### Acceptance criteria

- [ ] `overview.md` documents the items above, consistent with the shared-infrastructure
      spec, and its status is `specced` on the page and in the hub.
- [ ] Open questions are resolved or explicitly listed as deferred (previous-period
      comparison is deferred).
- [ ] A backend and a frontend implementation sub-issue for this tab are created under
      #1477, referencing the spec page.
- [ ] The created sub-issue numbers are added to the hub's sub-issue map.
- [ ] Documentation only: no code changes.
