# Plan: Spec: access statistics Visits tab

Issue: [1484-spec-access-statistics-visits-tab.md](../../issues/1484-spec-access-statistics-visits-tab.md)

## Overview
Documentation-only: fill in `docs/agents/specs/access-statistics/visits.md` (currently a
`stub`) with the decisions from the #1484 discussion, at the level of detail of
`overview.md` (#1483), then create the backend + frontend implementation sub-issues under
#1477 and record them in the spec and the hub.

## Context
The Visits tab (`/staff/statistics/visits`) is a stacked-bar chart of visits started per
bucket, split into anonymous and logged-in. It is the first tab implemented, proving the
pipeline #1498 (shared backend) → #1499 (frontend shell) → #1500 (Recharts setup) → this
tab. All conventions (params, validation, envelope, aggregator, RequestStore, Recharts
layering, i18n namespace) come from `shared-infrastructure.md`; the counting rules come from
`data-model.md`. No code changes.

## Implementation Steps

### Step 1 — Write `visits.md`
Replace every "To define (#1484)" placeholder, following `overview.md`'s structure:
- Header status `stub` → `specced`; extend "Decided" with the discussion outcomes.
- **Metrics:** visits started per bucket (`Visit.started_at`, half-open UTC range), split by
  `session.user` null/not null; keys `anonymous`, `logged_in`, `visits` per bucket and in
  `totals`; no hits.
- **Filters:** all shared filters, granularity control shown; audience filter zeroes the
  filtered-out series and the chart hides it (and its legend entry).
- **Chart and layout:** stacked bars on a categorical X axis over zero-filled buckets,
  `--majora-chart-*` colors, tooltip (clipped date range via `Intl.DateTimeFormat`, the
  three counts, logged-in share hidden when total is 0); loading / error / empty states;
  file layering (`StaffStatisticsVisits.jsx`, `VisitsController.js`, `VisitsChart.jsx`,
  `VisitsChartHelper.jsx`); i18n keys under `staff_statistics_page` `visits.*`.
- **API:** `GET /staff/statistics/visits.json`, shared decorator stack and validation,
  standard envelope with `buckets` + `totals`; one `VisitQuery` pass over
  `('started_at', 'session__user_id')`, `BucketCalendar` + `Series` + `metrics.count`;
  `visits` RequestStore quantity type; access-control row; not in Navi.
- **Edge cases:** no backfill before #1478, `user` + `audience=anonymous`, deleted users as
  anonymous, open visits, login as a visit boundary, DST buckets, unknown ids.
- **Open questions:** resolved or explicitly deferred.

### Step 2 — Create sub-issues and update the hub
Create two GitHub issues (labels `Feature`, `Spawned`, linked as sub-issues of #1477, in the
shape of #1503 / #1504): the backend `visits.json` endpoint (needs #1498) and the frontend
Visits tab (needs #1499, #1500 and the endpoint). List them in `visits.md`'s
"Implementation sub-issues" table, append them to the hub's sub-issue map, and change the
hub's Visits status to `specced`.

## Files to Change
- `docs/agents/specs/access-statistics/visits.md` — full spec.
- `docs/agents/specs/access-statistics.md` — Visits status and sub-issue map rows.

## Notes
- No code, so no CI checks beyond the docs lint already in CI (if any).
- Sub-issue numbers are only known after creation; write them into the docs afterwards.
