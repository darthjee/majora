# Visits tab

> **Status:** specced · **Owner:** #1484 · **Route:** `/staff/statistics/visits` · Back to the
> [hub](../access-statistics.md)

## Purpose

Visits-over-time chart, split into anonymous and logged-in.

## Decided

- Replaces the original "sessions graph": the chart counts **visits**, not sessions (see
  [data model](data-model.md)).
- Split into anonymous and logged-in.
- Implemented **first** among the tabs, since it proves the end-to-end pipeline: shared
  backend (#1498) → frontend shell (#1499) → Recharts setup (#1500) → this tab.
- Counts visits **started** in each bucket, split by the session's audience. **Visits only**:
  no hits (#1484 discussion).
- **Stacked bars**, one bar per bucket, anonymous and logged-in stacked (bar height = total).
- With an `audience` filter, the API still returns both keys and the chart **hides** the
  filtered-out series.
- A **dedicated** `GET /staff/statistics/visits.json` endpoint with the standard envelope
  (see [API](#api)).
- Implementation is a **backend + frontend pair**, like Overview (see
  [Implementation sub-issues](#implementation-sub-issues)).

## Metrics

All metrics cover the visits matched by the shared filters: `Visit.started_at` inside the
range (the half-open UTC interval of
[API conventions](shared-infrastructure.md#query-params)), combined with the `user`,
`domain` and `audience` filters on the visit's session. A visit belongs to the bucket (local
day, ISO week or month in `tz`) it **started** in.

| Key | Definition |
|-----|------------|
| `anonymous` | Matched visits whose session has no user (`session__user_id` is null) |
| `logged_in` | Matched visits whose session has a user (`session__user_id` is not null) |
| `visits` | All matched visits: always `anonymous + logged_in` |

- The same three keys appear on every bucket and in `totals`; `totals` is the sum over the
  buckets.
- Counts are `metrics.count` over the bucket's rows, partitioned by audience.
- **No hits**, no durations and no unique visitors on this tab (Visitors and Duration own
  those).

## Filters

- **Apply:** date range, `user`, `domain`, `audience` and `granularity`, all with the shared
  semantics. The filter bar **shows** the granularity control (the default), with the
  resolved granularity next to "Auto".
- **Audience:** the API always returns both `anonymous` and `logged_in` on every bucket and in
  `totals`. With `audience=anonymous`, every `logged_in` value is `0`; with
  `audience=logged_in`, every `anonymous` value is `0`. The chart reads the echoed
  `filters.audience` and **hides the filtered-out series** and its legend entry, so a single
  series is drawn; with `all`, both series are drawn.
- No tab-specific filters, no pagination.

## Chart and layout

Rendered inside `StaffStatisticsShell`, below the filter bar and tab nav:

1. **Totals line:** a short summary above the chart: total visits, anonymous and logged-in
   (`Intl.NumberFormat` in the browser locale), following the audience filter (hidden
   counts are not shown).
2. **Chart:** a Recharts `BarChart` in the shared
   `<ResponsiveContainer width="100%" height={300}>`, wrapped in
   `<div data-testid="statistics-visits-chart">`:
   - categorical `XAxis` over the zero-filled buckets (`dataKey="label"`), `YAxis` with
     integer ticks (`allowDecimals={false}`);
   - two `Bar`s with the same `stackId="visits"`: `anonymous`
     (`fill="var(--majora-chart-1)"`) at the bottom, `logged_in`
     (`fill="var(--majora-chart-2)"`) on top, so the bar height is the total;
   - `CartesianGrid` with `stroke="var(--majora-chart-grid)"`, axes with
     `var(--majora-chart-axis)`; a `Legend`; `isAnimationActive={false}`; composition order
     per the [Recharts conventions](shared-infrastructure.md#charting).
3. **Tooltip** (custom `content`, reading `entry.payload`):
   - the bucket's date range: clipped `start`–`end` formatted with `Intl.DateTimeFormat`
     (a single date when `start == end`, e.g. day granularity);
   - anonymous, logged-in and total counts (hidden series omitted);
   - the **logged-in share**: `logged_in / visits` as a whole percentage, **hidden when the
     total is 0** (and when the audience filter is not `all`, since it is then 0 % or
     100 % by construction).

**Bucket labels** (X axis): formatted on the client from `start` with
`Intl.DateTimeFormat`: day and week buckets show day and month (e.g. "5 Jan"; a week is
labeled by its clipped start), month buckets show month and year (e.g. "Jan 2026").

**Data points:** the controller maps `buckets` to a flat array, oldest first:
`{ start, end, label, anonymous, logged_in, visits, loggedInShare }`, where
`loggedInShare` is `null` when `visits == 0`. The helper only plots.

**States:**

- **Loading:** `LoadingMessage` (also the `Suspense` fallback while the lazy chart chunk
  loads).
- **Error:** the shared error message used by the other staff pages.
- **Empty** (`totals.visits == 0`): the zero-filled chart is still drawn (flat bars at 0, so
  the time axis stays visible), with a "No visits in this range" note above it. Before the
  #1478 deploy this is the normal state (see [Edge cases](#edge-cases)).

**Layering**, following the shared [Recharts conventions](shared-infrastructure.md#recharts-conventions):

- `pages/StaffStatisticsVisits.jsx` — route `staffStatisticsVisits`, replaces the shell
  placeholder, renders the totals line and the lazy `Charts.VisitsChart`;
- `pages/controllers/VisitsController.js` — RequestStore read of the `visits` quantity type
  with `StatisticsQuery.fromHash()`, maps the response to points and the visible series
  (from `filters.audience`), unit-tested with fake setters;
- `charts/VisitsChart.jsx` — the `data-testid` wrapper and `ResponsiveContainer`, re-exported
  from `charts/index.js`; smoke-tested for empty, single-point and normal data;
- `charts/helpers/VisitsChartHelper.jsx` — pure `render(points, { series })` returning the
  Recharts tree, plus the tooltip content;
- bucket-label and range formatting as pure helpers in `pages/helpers/` (shared with later
  time-series tabs), unit-tested.

**i18n:** the `staff_statistics_page` namespace, `visits.*` keys (en + pt): `visits.title`,
`visits.total`, `visits.anonymous`, `visits.logged_in`, `visits.logged_in_share`,
`visits.empty`. Series names in the legend and tooltip reuse `visits.anonymous` /
`visits.logged_in`.

## API

`GET /staff/statistics/visits.json`, following
[API conventions](shared-infrastructure.md#api-conventions) exactly:

- view `backend/staff/views/staff_statistics_visits.py` (`staff_statistics_visits`), URL
  name `staff-statistics-visits`, tests in
  `backend/staff/tests/staff_statistics_visits_test.py`;
- `@restricted` (`X-Skip-Cache: true`), `@api_view(['GET'])`, `AllowAny`, inline
  `require_staff` first (`401` / `403`);
- shared query params and validation (`parse_statistics_filters`), no pagination params;
- not added to the Navi warm-up chain;
- a row is added to [`access-control/staff-statistics.md`](../../access-control/staff-statistics.md);
- frontend: a `visits` quantity type in `staffStatisticsConfig.js`
  (`path: () => '/staff/statistics/visits.json'`, same `regular` / `private` variant,
  `permission: null`).

Response: the standard envelope:

```json
{
  "filters": {
    "from": "2026-09-28",
    "to": "2026-10-03",
    "tz": "Europe/Lisbon",
    "granularity": "day",
    "requested_granularity": "auto",
    "user": null,
    "domain": null,
    "audience": "all"
  },
  "buckets": [
    { "start": "2026-09-28", "end": "2026-09-28", "anonymous": 31, "logged_in": 6, "visits": 37 },
    { "start": "2026-09-29", "end": "2026-09-29", "anonymous": 0, "logged_in": 0, "visits": 0 },
    { "start": "2026-09-30", "end": "2026-09-30", "anonymous": 22, "logged_in": 9, "visits": 31 }
  ],
  "totals": { "anonymous": 53, "logged_in": 15, "visits": 68 }
}
```

(Buckets shortened; a real response has one bucket per day of the range.)

| Key | Type |
|-----|------|
| `buckets[].start`, `buckets[].end` | inclusive local date (`YYYY-MM-DD`), clipped to the range |
| `anonymous`, `logged_in`, `visits` (buckets and `totals`) | non-negative integer |

Query (ORM only, no raw SQL): **one `VisitQuery` pass**,
`VisitQuery(filters).rows('started_at', 'session__user_id')`. The rows are grouped with
`Series(BucketCalendar(filters)).group(rows, lambda row: row[0])`, then
`map(reducer)` with a reducer that counts rows with a null / non-null `session__user_id`
(`metrics.count`) and returns `{'anonymous', 'logged_in', 'visits'}`; `reducer([])` gives
zeros, which zero-fills empty buckets. `totals` sums the buckets. This lives in a small
aggregation class (e.g. `statistics/aggregation/visits_series.py` — `VisitsSeries(filters)`
returning `(buckets, totals)`), so the view stays thin and the logic is tested in
`statistics/tests/aggregation/`.

## Edge cases

- **No backfill:** visit data starts at the #1478 deploy. Buckets before it are zero; the tab
  shows the empty note when the whole range predates it, and a partially covered range
  simply starts with zero bars. No extra note is added (Overview carries the "first visit
  recorded" explanation).
- **`user` filter:** only that user's visits, so every `anonymous` value is `0` and only the
  logged-in series has data (both series stay drawn with `audience=all`). An unknown or
  deleted user id returns zero-filled buckets (shared rule).
- **`user` with `audience=anonymous`:** valid, zero-filled buckets (shared rule); the chart
  shows only the (empty) anonymous series and the empty note.
- **Deleted users:** their sessions have `user = NULL`, so their past visits count as
  **anonymous** (shared caveat); totals do not change when a user is deleted, only the split.
- **Open visits:** a visit still in progress is counted in the bucket it started in, like any
  other; its later activity never moves it. A visit that started before `from` is not counted
  even if it continues into the range.
- **Login is a visit boundary:** a browsing session where the visitor logs in shows up as one
  **anonymous** visit (ending with the login request) plus one **logged-in** visit on the
  new session (see [data model](data-model.md#visit-is-the-activity)), so logins inflate the
  total slightly. Accepted.
- **Proxy-cached requests** never reach Django, so anonymous visits on cached public routes
  are undercounted (shared caveat); the anonymous series is a lower bound.
- **Clipped buckets:** with week or month granularity, the first and last bars may cover
  fewer days than the others; the tooltip shows the clipped range so this is visible.
- **DST:** buckets are local calendar days (23 h or 25 h on transition days), per the shared
  `BucketCalendar`.
- **Null domains** are only reachable with `domain=unknown` (shared caveat).

## Open questions

- **Deferred:** a hits series (requests per bucket). Not in the first version: `hits` counts
  uncached backend requests, not page views, which would be misleading next to visits. It
  could be added later as an extra key without changing the existing ones.
- **Deferred:** comparison with the previous period, as on Overview.

## Implementation sub-issues

Created by #1484 under #1477. The Visits tab is implemented **first** among the tabs.

| Issue | Layer | Implements |
|-------|-------|------------|
| #1506 | Backend | [Metrics](#metrics), [API](#api) (`visits.json`, `VisitsSeries`, tests, access-control row); needs #1498 |
| #1507 | Frontend | [Filters](#filters), [Chart and layout](#chart-and-layout) (stacked bars, tooltip, states), `visits` quantity type, translations; needs #1499, #1500 and #1506 |
