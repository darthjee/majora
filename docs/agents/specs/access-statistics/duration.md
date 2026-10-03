# Duration tab

> **Status:** specced · **Owner:** #1486 · **Route:** `/staff/statistics/duration` · Back to
> the [hub](../access-statistics.md)

## Purpose

Average and median visit duration over time, hits per visit, and a histogram of visit
durations.

## Decided

- Replaces the original "average times" boundary item: in scope, backed by `Visit`
  tracking (#1478). Visit duration is `last_seen_at - started_at` (see
  [data model](data-model.md)).
- The median is computed in Python by the shared aggregator, since MySQL has no `MEDIAN`
  (see [shared infrastructure](shared-infrastructure.md)).
- **Single-hit visits** (duration `0`) are **included** in the average and the median, so
  `totals.average_duration_seconds` always equals Overview's `average_duration_seconds`.
  They get their own `0 s` histogram bin and are also reported as a single-hit count (and
  share) in `totals`, on every bucket and in the tooltip (#1486 discussion).
- **Histogram bin edges** are fixed for every range: `[0, 1, 30, 60, 180, 600, 1800, 3600]`
  seconds. The histogram covers the **whole range** (a tab-specific top-level key), not each
  bucket.
- **Three charts** under a totals line: average and median duration per bucket
  (`LineChart`), average and median hits per visit per bucket (`LineChart`), and the
  duration histogram (`BarChart`).
- **No audience split:** one series per metric; the shared `audience` filter narrows it.
- A visit belongs to the bucket it **started** in (same rule as Visits and Overview); open
  visits count with their current duration.
- A **dedicated** `GET /staff/statistics/duration.json` endpoint with the standard envelope
  plus a `histogram` key (see [API](#api)).
- Implementation is a **backend + frontend pair**, like Visits (see
  [Implementation sub-issues](#implementation-sub-issues)).

## Metrics

All metrics cover the visits matched by the shared filters: `Visit.started_at` inside the
range (the half-open UTC interval of
[API conventions](shared-infrastructure.md#query-params)), combined with the `user`,
`domain` and `audience` filters on the visit's session. A visit belongs to the bucket (local
day, ISO week or month in `tz`) it **started** in.

Per visit: **duration** = `last_seen_at − started_at` in whole seconds; **hits** =
`Visit.hits`.

| Key | Definition | Empty bucket |
|-----|------------|--------------|
| `visits` | `metrics.count` of the matched visits | `0` |
| `single_hit_visits` | Matched visits with `hits == 1` | `0` |
| `average_duration_seconds` | `metrics.average` of the durations, rounded to the nearest integer | `null` |
| `median_duration_seconds` | `metrics.median` of the durations, rounded to the nearest integer | `null` |
| `average_hits` | `metrics.average` of the hits, rounded to one decimal place | `null` |
| `median_hits` | `metrics.median` of the hits (may end in `.5` for an even count) | `null` |

- The same six keys appear on every bucket and in `totals`.
- `totals` is computed over **all** matched visits of the range, never from the bucket
  values (an average of bucket averages or a median of bucket medians would be wrong).
  `totals.visits` and `totals.average_duration_seconds` therefore equal Overview's `visits`
  and `average_duration_seconds` for the same filters; both endpoints use the same rounding.
- **Single-hit vs `0 s`:** a 1-hit visit always has duration `0`, but a multi-hit visit can
  also last under one second (rounded down to `0`). `single_hit_visits` is defined by
  `hits`, the `0 s` histogram bin by duration, so the bin count can be slightly higher than
  `single_hit_visits`.
- **Single-hit share** (`single_hit_visits / visits`) is computed on the **client**, like
  the Visits tab's `loggedInShare`, and is `null` when `visits == 0`. It is not in the
  response.

### Histogram

The top-level `histogram` key is
`metrics.histogram(durations, [0, 1, 30, 60, 180, 600, 1800, 3600])` over **all** matched
visits of the range: always **eight** bins, oldest edge first, zero counts included, the
last bin with `upper: null`. The counts sum to `totals.visits`.

| # | `lower` | `upper` | Label |
|---|---------|---------|-------|
| 1 | `0` | `1` | `0 s` |
| 2 | `1` | `30` | `<30 s` |
| 3 | `30` | `60` | `30 s–1 m` |
| 4 | `60` | `180` | `1–3 m` |
| 5 | `180` | `600` | `3–10 m` |
| 6 | `600` | `1800` | `10–30 m` |
| 7 | `1800` | `3600` | `30 m–1 h` |
| 8 | `3600` | `null` | `≥1 h` |

Bins are half-open (`lower <= duration < upper`). Since durations are whole seconds, the
`[0, 1)` bin holds exactly the `0` s visits, so no extra helper is needed.

## Filters

- **Apply:** date range, `user`, `domain`, `audience` and `granularity`, all with the shared
  semantics. The filter bar **shows** the granularity control (the default), with the
  resolved granularity next to "Auto".
- **Granularity** only affects the two time-series charts; the histogram always covers the
  whole range.
- **Audience:** no split. The filter narrows the matched visits, and every metric is
  computed over them.
- No tab-specific filters, no pagination.

## Chart and layout

Rendered inside `StaffStatisticsShell`, below the filter bar and tab nav:

1. **Totals line:** visits, average and median duration, average hits per visit and the
   single-hit share (whole percentage, hidden when `visits == 0`). Numbers use
   `Intl.NumberFormat` in the browser locale; durations use Overview's duration formatter
   (`Xm Ys`, `Xh Ym` from one hour, `—` when `null`).
2. **Duration chart:** a Recharts `LineChart` in the shared
   `<ResponsiveContainer width="100%" height={300}>`, wrapped in
   `<div data-testid="statistics-duration-chart">`:
   - categorical `XAxis` over the zero-filled buckets (`dataKey="label"`); `YAxis` in seconds
     with `tickFormatter` = the duration formatter;
   - two `Line`s: `average_duration_seconds` (`stroke="var(--majora-chart-1)"`) and
     `median_duration_seconds` (`stroke="var(--majora-chart-2)"`), with
     `connectNulls={false}` so empty buckets are **gaps**, not zeros;
   - `CartesianGrid` with `stroke="var(--majora-chart-grid)"`, axes with
     `var(--majora-chart-axis)`; a `Legend`; `isAnimationActive={false}`; composition order
     per the [Recharts conventions](shared-infrastructure.md#charting).
3. **Hits per visit chart:** the same structure
   (`<div data-testid="statistics-hits-per-visit-chart">`), with `average_hits`
   (`var(--majora-chart-1)`) and `median_hits` (`var(--majora-chart-2)`); `YAxis` with
   `Intl.NumberFormat` ticks (one decimal at most).
4. **Histogram chart:** a Recharts `BarChart`
   (`<div data-testid="statistics-duration-histogram-chart">`), one `Bar` for `count`
   (`fill="var(--majora-chart-3)"`), categorical `XAxis` over the eight bin labels of the
   [histogram table](#histogram) (translated), `YAxis` with integer ticks
   (`allowDecimals={false}`). No legend (single series).

**Tooltips** (custom `content`, reading `entry.payload`):

- **Time-series charts:** the bucket's clipped `start`–`end` with `Intl.DateTimeFormat` (a
  single date when `start == end`), both values of the chart (formatted durations or hits;
  `—` when `null`), the bucket's visit count and its single-hit share (hidden when the
  bucket has no visits).
- **Histogram:** the bin label, its count and its share of `totals.visits` (whole
  percentage, hidden when `totals.visits == 0`).

**Bucket labels** (X axis): the shared bucket-label helper from the Visits tab (day and
week buckets show day and month, month buckets show month and year).

**Data points:** the controller maps the response to:

- `points`: `buckets` flattened, oldest first, as `{ start, end, label, visits,
  single_hit_visits, singleHitShare, average_duration_seconds, median_duration_seconds,
  average_hits, median_hits }`, where `singleHitShare` is `null` when `visits == 0`;
- `bins`: `histogram` as `{ lower, upper, labelKey, count, share }`, where `share` is
  `count / totals.visits` (`null` when `totals.visits == 0`);
- `totals` plus the client-side `singleHitShare`.

The helpers only plot.

**States:**

- **Loading:** `LoadingMessage` (also the `Suspense` fallback while the lazy chart chunk
  loads).
- **Error:** the shared error message used by the other staff pages.
- **Empty** (`totals.visits == 0`): the charts are still drawn (time axis visible, no
  lines since every value is `null`; the histogram with eight bars at `0`), with a "No visits
  in this range" note above them.

**Layering**, following the shared [Recharts conventions](shared-infrastructure.md#recharts-conventions):

- `pages/StaffStatisticsDuration.jsx` — route `staffStatisticsDuration`, replaces the shell
  placeholder, renders the totals line and the three lazy charts
  (`Charts.DurationChart`, `Charts.HitsPerVisitChart`, `Charts.DurationHistogramChart`);
- `pages/controllers/DurationController.js` — RequestStore read of the `duration` quantity
  type with `StatisticsQuery.fromHash()`, maps the response to `points`, `bins` and
  `totals`, unit-tested with fake setters;
- `charts/DurationChart.jsx`, `charts/HitsPerVisitChart.jsx`,
  `charts/DurationHistogramChart.jsx` — the `data-testid` wrappers and
  `ResponsiveContainer`s, re-exported from `charts/index.js`; smoke-tested for empty,
  single-point and normal data;
- `charts/helpers/DurationChartHelper.jsx`, `charts/helpers/HitsPerVisitChartHelper.jsx`,
  `charts/helpers/DurationHistogramChartHelper.jsx` — pure `render(...)` returning the
  Recharts tree, plus the tooltip content;
- reuses the bucket-label / range helpers in `pages/helpers/` (Visits tab) and Overview's
  duration formatter; no new formatting helper is needed beyond the bin labels.

**i18n:** the `staff_statistics_page` namespace, `duration.*` keys (en + pt):
`duration.title`, `duration.visits`, `duration.average_duration`,
`duration.median_duration`, `duration.average_hits`, `duration.median_hits`,
`duration.single_hit_share`, `duration.duration_chart`, `duration.hits_chart`,
`duration.histogram_chart`, `duration.histogram_share`, `duration.empty`, and the bin labels
`duration.bins.zero`, `duration.bins.under_30s`, `duration.bins.30s_1m`,
`duration.bins.1m_3m`, `duration.bins.3m_10m`, `duration.bins.10m_30m`,
`duration.bins.30m_1h`, `duration.bins.over_1h`. Series names in the legends and tooltips
reuse the metric keys.

## API

`GET /staff/statistics/duration.json`, following
[API conventions](shared-infrastructure.md#api-conventions) exactly:

- view `backend/staff/views/staff_statistics_duration.py` (`staff_statistics_duration`),
  URL name `staff-statistics-duration`, tests in
  `backend/staff/tests/staff_statistics_duration_test.py`;
- `@restricted` (`X-Skip-Cache: true`), `@api_view(['GET'])`, `AllowAny`, inline
  `require_staff` first (`401` / `403`);
- shared query params and validation (`parse_statistics_filters`), no pagination params;
- not added to the Navi warm-up chain;
- a row is added to [`access-control/staff-statistics.md`](../../access-control/staff-statistics.md);
- frontend: a `duration` quantity type in `staffStatisticsConfig.js`
  (`path: () => '/staff/statistics/duration.json'`, same `regular` / `private` variant,
  `permission: null`).

Response: the standard envelope plus `histogram`:

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
    {
      "start": "2026-09-28", "end": "2026-09-28",
      "visits": 37, "single_hit_visits": 12,
      "average_duration_seconds": 241, "median_duration_seconds": 95,
      "average_hits": 6.4, "median_hits": 4
    },
    {
      "start": "2026-09-29", "end": "2026-09-29",
      "visits": 0, "single_hit_visits": 0,
      "average_duration_seconds": null, "median_duration_seconds": null,
      "average_hits": null, "median_hits": null
    },
    {
      "start": "2026-09-30", "end": "2026-09-30",
      "visits": 31, "single_hit_visits": 9,
      "average_duration_seconds": 312, "median_duration_seconds": 120,
      "average_hits": 7.1, "median_hits": 4.5
    }
  ],
  "totals": {
    "visits": 68, "single_hit_visits": 21,
    "average_duration_seconds": 273, "median_duration_seconds": 104,
    "average_hits": 6.7, "median_hits": 4
  },
  "histogram": [
    { "lower": 0, "upper": 1, "count": 22 },
    { "lower": 1, "upper": 30, "count": 5 },
    { "lower": 30, "upper": 60, "count": 6 },
    { "lower": 60, "upper": 180, "count": 11 },
    { "lower": 180, "upper": 600, "count": 13 },
    { "lower": 600, "upper": 1800, "count": 8 },
    { "lower": 1800, "upper": 3600, "count": 2 },
    { "lower": 3600, "upper": null, "count": 1 }
  ]
}
```

(Buckets shortened; a real response has one bucket per day of the range.)

| Key | Type |
|-----|------|
| `buckets[].start`, `buckets[].end` | inclusive local date (`YYYY-MM-DD`), clipped to the range |
| `visits`, `single_hit_visits` (buckets and `totals`) | non-negative integer |
| `average_duration_seconds`, `median_duration_seconds` (buckets and `totals`) | non-negative integer, or `null` when there are no visits |
| `average_hits` (buckets and `totals`) | number with at most one decimal, or `null` |
| `median_hits` (buckets and `totals`) | integer or `.5` number, or `null` |
| `histogram[].lower` | non-negative integer (seconds) |
| `histogram[].upper` | integer (seconds), or `null` for the last bin |
| `histogram[].count` | non-negative integer |

Query (ORM only, no raw SQL): **one `VisitQuery` pass**,
`VisitQuery(filters).rows('started_at', 'last_seen_at', 'hits')`. Each row gives a
duration (whole seconds) and its hits. The rows are grouped with
`Series(BucketCalendar(filters)).group(rows, lambda row: row[0])`, then `map(reducer)` with
a reducer that returns the six keys from `metrics.count` / `average` / `median`;
`reducer([])` gives `0` counts and `null` averages / medians, which zero-fills empty
buckets. `totals` is the same reducer applied to **all** rows, and `histogram` is
`metrics.histogram` over all durations. This lives in a small aggregation class
(`statistics/aggregation/duration_series.py` — `DurationSeries(filters)` returning
`(buckets, totals, histogram)`), so the view stays thin and the logic is tested in
`statistics/tests/aggregation/`.

## Edge cases

- **Precision:** the #1478 write throttle only applies to `Session.last_seen_at`
  (`statistics/middleware.py`). `Visit.last_seen_at` is updated on **every** uncached
  request with an atomic `UPDATE` (`statistics/visit_tracking.py`), so durations are exact
  to the request. **No compensation logic** is needed for the throttle. The real limits:
  - duration measures the **first to the last backend request**, so the time spent on the
    last page is never seen and a single-page visit lasts `0` s;
  - **proxy-cached requests** never reach Django and never extend a visit.

  Durations are therefore a **lower bound** of the real time on site.
- **Inactivity window:** a gap longer than 30 minutes starts a new visit, so idle gaps never
  inflate a duration beyond the window.
- **Open visits** count with their current duration (`last_seen_at − started_at`) and can
  move to a higher histogram bin, and change the bucket's average / median, on refresh.
- **Visits that started before `from`** are not counted, even if they continue into the
  range.
- **Login is a visit boundary:** a browsing session where the visitor logs in is split into
  an anonymous visit (ending with the login request) and a logged-in visit on the new
  session (see [data model](data-model.md#visit-is-the-activity)), so durations of those
  sessions are split in two shorter visits. Accepted.
- **No backfill:** visit data starts at the #1478 deploy; earlier buckets are empty (`null`
  gaps), and the whole tab shows the empty note when the range predates it.
- **Median on an even count:** the mean of the two middle values (shared `metrics.median`),
  rounded to an integer for durations; hits keep the `.5`.
- **`user` filter:** only that user's visits; an unknown or deleted user id returns
  zero-filled buckets (shared rule). **`user` with `audience=anonymous`:** valid,
  zero-filled buckets (shared rule).
- **Deleted users** (sessions with `user = NULL`) count as anonymous, and **null domains**
  are only reachable with `domain=unknown` (shared caveats).
- **Clipped buckets:** with week or month granularity, the first and last buckets may cover
  fewer days; the tooltip shows the clipped range.
- **DST:** buckets are local calendar days (23 h or 25 h on transition days), per the shared
  `BucketCalendar`. Durations are UTC differences, so a visit spanning a DST change keeps
  its real length.

## Open questions

- **Deferred:** comparison with the previous period, as on Overview.
- **Deferred:** an audience split (anonymous vs logged-in series); the audience filter
  covers it for now.
- **Deferred:** configurable histogram bins, or per-bucket histograms.
- **Deferred:** percentiles beyond the median (e.g. p90).

## Implementation sub-issues

Created by #1486 under #1477.

| Issue | Layer | Implements |
|-------|-------|------------|
| #1513 | Backend | [Metrics](#metrics), [Histogram](#histogram), [API](#api) (`duration.json`, `DurationSeries`, tests, access-control row); needs #1498 |
| #1514 | Frontend | [Filters](#filters), [Chart and layout](#chart-and-layout) (totals line, two line charts, histogram, tooltips, states), `duration` quantity type, translations; needs #1499, #1500 and #1513 |
