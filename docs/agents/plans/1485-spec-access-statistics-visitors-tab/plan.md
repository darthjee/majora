# Plan: Spec: access statistics Visitors tab

Issue: [1485-spec-access-statistics-visitors-tab.md](../../issues/1485-spec-access-statistics-visitors-tab.md)

## Overview
Documentation-only: fill in `docs/agents/specs/access-statistics/visitors.md` (currently a
`stub`) with the decisions from the #1485 discussion, at the level of detail of
`overview.md` (#1483) and `visits.md` (#1484), then create the backend + frontend
implementation sub-issues under #1477 and record them in the spec and the hub.

## Context
The Visitors tab (`/staff/statistics/visitors`) shows unique visitors per bucket in two
stacked-bar charts, new vs returning and anonymous vs logged-in, with a range-level summary
above them. A visitor key is **returning** in a bucket if it has any `Visit` before that
bucket's start, otherwise **new**. Range totals use Overview's definition (before the range
start), so they match the Overview tiles. All conventions (params, validation, envelope,
aggregator, RequestStore, Recharts layering, i18n namespace) come from
`shared-infrastructure.md`; the counting rules come from `data-model.md`. No code changes.

## Implementation Steps

### Step 1 — Write `visitors.md`
Replace every "To define (#1485)" placeholder, following `overview.md` / `visits.md`:
- Header status `stub` → `specced`; extend "Decided" with the discussion outcomes.
- **Metrics:** per bucket, over visits started in the bucket (half-open UTC range, shared
  filters): `unique_visitors` (`metrics.unique` of visitor keys), `new_visitors` /
  `returning_visitors` (any `Visit` before the **bucket** start, on any domain, ignoring the
  `domain` / `audience` filters), `anonymous` / `logged_in` (distinct keys by audience).
  Invariants: `new + returning == unique` and `anonymous + logged_in == unique`, per bucket
  and in `totals`. `totals` are range-level distinct counts, with new vs returning measured
  against the **range** start (Overview's definition).
- **Filters:** all shared filters, granularity control shown. With `audience=anonymous` or
  `logged_in`, the filtered-out series of the anonymous / logged-in chart is all zeros and is
  hidden (with its legend entry), as on Visits.
- **Chart and layout:** a summary row of the range totals (with a note that totals are not
  sums of buckets), then two stacked-bar charts sharing a categorical X axis over the
  zero-filled buckets: (1) new vs returning, (2) anonymous vs logged-in; bar height = unique
  visitors; `--majora-chart-*` colors; tooltips with the clipped date range
  (`Intl.DateTimeFormat`), both series, the total and a share percentage (hidden when the
  total is 0). Loading / error / empty states; file layering
  (`StaffStatisticsVisitors.jsx`, `VisitorsController.js`, chart components and pure render
  helpers per the shared Recharts conventions); i18n keys under `staff_statistics_page`
  `visitors.*`; a "first visit recorded" note as in Overview.
- **API:** `GET /staff/statistics/visitors.json` (view `staff_statistics_visitors`, URL name
  `staff-statistics-visitors`), shared decorator stack and validation, standard envelope
  with `buckets` (`start`, `end`, `unique_visitors`, `new_visitors`, `returning_visitors`,
  `anonymous`, `logged_in`) and `totals` (same keys minus `start` / `end`), with an example
  JSON and a key/type table. Queries: one `VisitQuery` pass over
  `('started_at', 'session_id', 'session__user_id')`, then one first-visit-ever lookup
  (`Min('started_at')` grouped by `session__user_id` for user keys and by `session_id` for
  anonymous keys, restricted to the in-range keys, skipped when there are no rows). A key is
  returning in a bucket when its first visit is before the bucket start, and in the range
  when it is before `start_utc`. Logic lives in an aggregation class (e.g.
  `statistics/aggregation/visitors_series.py` — `VisitorsSeries(filters)`) using
  `BucketCalendar` + `Series` + `metrics`. `visitors` RequestStore quantity type;
  access-control row; not in Navi.
- **Edge cases:** no backfill (near the deploy almost everyone is new), the user filter
  (0 or 1 per bucket), `user` + `audience=anonymous` (zeros), an anonymous visitor who later
  logs in (two keys), deleted users as anonymous, the domain filter not affecting the
  first-visit lookup, a first bucket clipped to `from` (new vs returning uses the clipped
  start), DST buckets, unknown ids.
- **Open questions:** resolved or explicitly deferred (e.g. previous-period comparison,
  deferred as in Overview).

### Step 2 — Create sub-issues and update the hub
Create two GitHub issues (labels `Feature`, `Spawned`, linked as sub-issues of #1477, in the
shape of #1503 / #1504): the backend `visitors.json` endpoint (needs #1498) and the frontend
Visitors tab (needs #1499, #1500 and the endpoint). List them in `visitors.md`'s
"Implementation sub-issues" table, append them to the hub's sub-issue map, and change the
hub's Visitors status to `specced`.

## Files to Change
- `docs/agents/specs/access-statistics/visitors.md` — full spec.
- `docs/agents/specs/access-statistics.md` — Visitors status and sub-issue map rows.

## Notes
- No code, so there are no CI checks beyond docs lint.
- Sub-issue numbers are only known after creation; write them into the docs afterwards.
- Overview's tile 2 / tile 5 link to this tab; the definitions must stay consistent with
  `overview.md` (range totals equal Overview's `unique_visitors`, `new_visitors`,
  `returning_visitors` for the same filters).
