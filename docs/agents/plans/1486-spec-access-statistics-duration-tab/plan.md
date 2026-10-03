# Plan: Spec: access statistics Duration tab

Issue: [1486-spec-access-statistics-duration-tab.md](../../issues/1486-spec-access-statistics-duration-tab.md)

## Overview

Documentation only. Fill the `duration.md` stub with the full Duration tab spec, using the
decisions settled in the #1486 discussion and the shape of the already-specced Visits /
Visitors pages. Then create the backend + frontend implementation sub-issues under #1477 and
record them in the spec page and the hub. No code changes.

## Context

- Sibling specs to mirror in structure and level of detail:
  `docs/agents/specs/access-statistics/visits.md` (Decided, Metrics, Filters, Chart and
  layout, API, Edge cases, Open questions, Implementation sub-issues) and `overview.md`.
- Shared building blocks (from `shared-infrastructure.md`): `StatisticsFilters`,
  `VisitQuery(filters).rows(...)`, `BucketCalendar`, `Series(...).group(...).map(reducer)`
  (zero-fills via `reducer([])`), `metrics.count` / `average` / `median` / `histogram`,
  the standard envelope (`filters`, `buckets`, `totals`, plus tab-specific top-level keys),
  Recharts conventions (CSS-variable colors, `isAnimationActive={false}`, lazy `Charts.*`,
  page / controller / chart / pure helper layering).
- Decisions from the discussion:
  - single-hit visits (duration `0`) are **included** in average and median (so
    `totals.average_duration_seconds` equals Overview's), get their own `0 s` histogram
    bin, and are reported as a single-hit count and share;
  - histogram edges `[0, 1, 30, 60, 180, 600, 1800, 3600]` seconds, fixed, whole range only;
  - three charts: duration LineChart (average + median), hits-per-visit LineChart
    (average + median), histogram BarChart;
  - no audience split; visits bucketed by the bucket they **started** in; open visits count
    with their current duration.
- Precision finding (replaces the issue's "write throttle" item): only
  `Session.last_seen_at` is throttled (`backend/statistics/middleware.py`);
  `Visit.last_seen_at` is updated on every uncached request
  (`backend/statistics/visit_tracking.py`), so durations are exact to the request.

## Implementation Steps

### Step 1 — Write the Duration spec page

Rewrite `docs/agents/specs/access-statistics/duration.md` from stub to `specced`
(header `**Status:** specced`), following `visits.md`'s section layout:

- **Purpose / Decided:** the discussion decisions above; dedicated
  `GET /staff/statistics/duration.json`; implementation as a backend + frontend pair.
- **Metrics:** matched visits = shared filters on `Visit.started_at` (half-open UTC interval)
  plus `user` / `domain` / `audience`; bucket = the one the visit **started** in. Keys on
  every bucket and in `totals`:
  - `visits` (`metrics.count`);
  - `single_hit_visits` (visits with `hits == 1`; note that a 1-hit visit always has
    duration `0`, while a multi-hit visit can also round to `0` s — the single-hit metric
    is defined by `hits`, the `0 s` histogram bin by duration);
  - `average_duration_seconds`, `median_duration_seconds` (whole seconds, average rounded
    to the nearest integer; median of whole-second values, rounded the same way), `null`
    when the bucket has no visits;
  - `average_hits`, `median_hits` (one decimal place for the average; median may be `.5`),
    `null` when empty.
  - `totals` is computed over **all** matched visits (not an average of bucket averages);
    `totals.single_hit_share` = `single_hit_visits / visits` (or the client computes it —
    pick one and state it; recommendation: client-side, like Visits'
    `loggedInShare`).
- **Histogram:** top-level `histogram` key, `metrics.histogram(durations, [0, 1, 30, 60,
  180, 600, 1800, 3600])` → eight `{lower, upper, count}` bins, last `upper: null`; covers
  the whole range, always all eight bins (zero counts included).
- **Filters:** all shared filters apply including granularity (shown); no audience split,
  no tab-specific filters, no pagination.
- **Chart and layout:** totals line (visits, average / median duration, average hits,
  single-hit share); chart 1 duration `LineChart` (two lines, Y axis formatted with the
  Overview duration formatter, `connectNulls={false}` so empty buckets are gaps, not
  zeros); chart 2 hits-per-visit `LineChart`; chart 3 histogram `BarChart` with a
  categorical X axis of bin labels (`0 s`, `<30 s`, `30 s–1 m`, `1–3 m`, `3–10 m`,
  `10–30 m`, `30 m–1 h`, `≥1 h`) and the share of visits per bin in the tooltip. Tooltips
  for the time-series charts show the clipped bucket range, both values, visit count and
  single-hit share. States (loading, error, empty with zero-filled axes and a note).
  Layering: `pages/StaffStatisticsDuration.jsx`, `pages/controllers/DurationController.js`,
  `charts/DurationChart.jsx`, `charts/HitsPerVisitChart.jsx`,
  `charts/DurationHistogramChart.jsx` with pure helpers under `charts/helpers/`; reuse the
  shared bucket-label / range helpers and Overview's duration formatter. i18n keys under
  `staff_statistics_page` → `duration.*` (en + pt), listed explicitly.
- **API:** view `backend/staff/views/staff_statistics_duration.py`, URL name
  `staff-statistics-duration`, `@restricted`, `require_staff`, `parse_statistics_filters`,
  not warmed by Navi, an access-control row in
  `docs/agents/access-control/staff-statistics.md`, a `duration` quantity type in
  `staffStatisticsConfig.js`. Example response JSON and a key/type table. Query: one
  `VisitQuery` pass over `('started_at', 'last_seen_at', 'hits')`, aggregated by a
  `DurationSeries(filters)` class in `statistics/aggregation/duration_series.py` returning
  `(buckets, totals, histogram)`, tested in `statistics/tests/aggregation/`.
- **Edge cases:** precision (exact to the request; duration is first-to-last backend
  request, so time on the last page is never counted and a single-page visit is `0` s;
  proxy-cached requests never extend a visit, so durations are a lower bound); the
  30-minute inactivity window caps idle gaps; open visits use their current duration and
  can move between histogram bins on refresh; visits that started before `from` are
  excluded; login is a visit boundary (splits one browsing session into two shorter
  visits); no backfill; deleted users / null domains / `user` + `audience=anonymous` per
  the shared rules; median on an even count; DST per `BucketCalendar`.
- **Open questions:** list anything deferred (e.g. previous-period comparison, an audience
  split, configurable bins, percentiles beyond the median).

### Step 2 — Create implementation sub-issues and update the hub

- Create two GitHub issues as sub-issues of #1477, each referencing `duration.md`:
  - **Backend:** "Implementation: Duration endpoint (`duration.json`)": Metrics, Histogram
    and API sections (`DurationSeries`, view, URL, tests, access-control row); needs #1498.
  - **Frontend:** "Implementation: Duration tab (duration, hits and histogram charts)":
    Filters and Chart and layout sections, `duration` quantity type, translations; needs
    #1499, #1500 and the backend issue.
- Fill `duration.md`'s **Implementation sub-issues** table with the two numbers (same format
  as `visits.md`).
- In `docs/agents/specs/access-statistics.md`: set Duration to `specced` (#1486) and append
  both rows to the sub-issue map ("Created by #1486; needs …").

## Files to Change

- `docs/agents/specs/access-statistics/duration.md` — full Duration tab spec (stub →
  specced), plus the implementation sub-issue table.
- `docs/agents/specs/access-statistics.md` — Duration status `specced`; two new rows in the
  sub-issue map.

## CI Checks

- Markdown: `yarn lint_md` (CI job: `markdownlint`), run through the project's
  docker-compose/make tooling, never on the host.

## Notes

- No code changes: backend, frontend, Navi and proxy are untouched by this issue.
- The issue's "write throttle" concern is resolved as a non-issue for `Visit`; the spec must
  say so explicitly so implementers don't add compensation logic.
- Keep `totals.average_duration_seconds` defined identically to Overview's
  `average_duration_seconds` so the two tabs always agree.
- If `metrics.histogram` lacks a way to count values `>= 0 and < 1` cleanly with integer
  seconds, edges `[0, 1, …]` already give a `[0, 1)` bin equal to duration `0`; no new
  helper is needed.
