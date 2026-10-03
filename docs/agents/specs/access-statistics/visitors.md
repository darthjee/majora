# Visitors tab

> **Status:** specced · **Owner:** #1485 · **Route:** `/staff/statistics/visitors` · Back to
> the [hub](../access-statistics.md)

## Purpose

Unique visitors over time, split into new and returning, and anonymous and logged-in.

## Decided

- "Unique visitors" means distinct visitors with visits, using the visitor key, and is an
  estimate (see [data model](data-model.md)).
- Split into new vs returning, and anonymous vs logged-in.
- **Per bucket**, unique visitors are the distinct visitor keys among the visits **started**
  in the bucket (#1485 discussion).
- **New vs returning per bucket:** a key is *returning* in a bucket if it has any `Visit`
  before that **bucket's start**, otherwise *new*. A visitor is therefore new only in the
  bucket of their first visit ever. The earlier-visits lookup is the same "first visit
  ever" rule as [Overview](overview.md#metrics): it ignores the range and the `domain` /
  `audience` filters.
- **Two stacked-bar charts** sharing the X axis: (1) new vs returning, (2) anonymous vs
  logged-in. In both, the bar height is the bucket's unique visitors.
- **`totals` are range-level distinct counts**, with new vs returning measured against the
  **range** start (Overview's definition), so they match the Overview tiles. They are not
  sums of the buckets.
- With an `audience` filter, the API still returns every key and chart 2 **hides** the
  filtered-out series, as on [Visits](visits.md#filters).
- A **dedicated** `GET /staff/statistics/visitors.json` endpoint with the standard envelope
  (see [API](#api)).
- Implementation is a **backend + frontend pair**, like Overview and Visits (see
  [Implementation sub-issues](#implementation-sub-issues)).

## Metrics

All metrics cover the visits matched by the shared filters: `Visit.started_at` inside the
range (the half-open UTC interval of
[API conventions](shared-infrastructure.md#query-params)), combined with the `user`,
`domain` and `audience` filters on the visit's session. A visit belongs to the bucket (local
day, ISO week or month in `tz`) it **started** in. "Visitor key" is the
[data model](data-model.md#visitor-key) key: `('user', user_id)` when the session has a user,
otherwise `('session', session_id)` (`VisitQuery.visitor_key`).

**Per bucket** (over the bucket's matched visits):

| Key | Definition |
|-----|------------|
| `unique_visitors` | `metrics.unique` of the visitor keys of the bucket's visits |
| `new_visitors` | Those keys whose **first visit ever** falls inside this bucket (no `Visit` before the bucket's start) |
| `returning_visitors` | Those keys with at least one `Visit` before the bucket's start |
| `anonymous` | Distinct anonymous keys (`('session', …)`) among them |
| `logged_in` | Distinct user keys (`('user', …)`) among them |

**In `totals`** (over every matched visit of the range, each key counted once):

| Key | Definition |
|-----|------------|
| `unique_visitors` | `metrics.unique` of all matched visitor keys; equals Overview's `unique_visitors` |
| `new_visitors` | Keys with **no** `Visit` before `start_utc`; equals Overview's `new_visitors` |
| `returning_visitors` | Keys with at least one `Visit` before `start_utc`; equals Overview's `returning_visitors` |
| `anonymous` | Distinct anonymous keys in the range |
| `logged_in` | Distinct user keys in the range; equals Overview's `logged_in_users` |

- **Invariants,** on every bucket and in `totals`: `new_visitors + returning_visitors ==
  unique_visitors` and `anonymous + logged_in == unique_visitors`.
- **Totals are not sums of buckets:** a visitor seen in several buckets counts once in each
  of them, but once in `totals`. Likewise a visitor is new in at most one bucket (the bucket
  of their first visit) and returning in every later one.
- **First visit ever:** the lookup ignores the range and the `domain` / `audience` filters
  (any domain), exactly as on [Overview](overview.md#metrics). Since a key's first visit is
  never after any of its matched visits, a key is new in a bucket exactly when its first
  visit ever falls in that bucket, and returning in the range exactly when its first visit
  is before `start_utc`.
- The first bucket's start is clipped to `from`, so its new vs returning split uses the
  clipped start, which is the range start: the first bucket's new / returning split is
  consistent with `totals` for the visitors seen in it.
- No hits and no durations on this tab (Visits and Duration own those).

## Filters

- **Apply:** date range, `user`, `domain`, `audience` and `granularity`, all with the shared
  semantics. The filter bar **shows** the granularity control (the default), with the
  resolved granularity next to "Auto".
- **Audience:** the API always returns every key on every bucket and in `totals`. With
  `audience=anonymous`, every `logged_in` value is `0`; with `audience=logged_in`, every
  `anonymous` value is `0`. Chart 2 (anonymous vs logged-in) reads the echoed
  `filters.audience` and **hides the filtered-out series** and its legend entry; with `all`,
  both series are drawn. Chart 1 (new vs returning) always draws both series, computed over
  the filtered audience.
- **Domain:** narrows the in-range visits only; the first-visit lookup still looks at every
  domain.
- No tab-specific filters, no pagination.

## Chart and layout

Rendered inside `StaffStatisticsShell`, below the filter bar and tab nav:

1. **Summary row** (range totals, `Intl.NumberFormat` in the browser locale): unique
   visitors, new, returning (with the returning share, `returning_visitors /
   unique_visitors` as a whole percentage, hidden when `unique_visitors == 0`), anonymous
   and logged-in (following the audience filter: hidden counts are not shown). A short
   note below it says that range totals are not sums of the bars, since a visitor seen in
   several periods counts once, and that "new" means "first visit recorded" (as on
   Overview, see [Edge cases](#edge-cases)).
2. **Chart 1 — new vs returning:** a Recharts `BarChart` in the shared
   `<ResponsiveContainer width="100%" height={300}>`, wrapped in
   `<div data-testid="statistics-visitors-new-returning-chart">`:
   - categorical `XAxis` over the zero-filled buckets (`dataKey="label"`), `YAxis` with
     integer ticks (`allowDecimals={false}`);
   - two `Bar`s with the same `stackId="new-returning"`: `new_visitors`
     (`fill="var(--majora-chart-3)"`) at the bottom, `returning_visitors`
     (`fill="var(--majora-chart-4)"`) on top, so the bar height is `unique_visitors`;
   - `CartesianGrid` with `stroke="var(--majora-chart-grid)"`, axes with
     `var(--majora-chart-axis)`; a `Legend`; `isAnimationActive={false}`; composition order
     per the [Recharts conventions](shared-infrastructure.md#charting).
3. **Chart 2 — anonymous vs logged-in:** the same structure, wrapped in
   `<div data-testid="statistics-visitors-audience-chart">`, with `stackId="audience"`:
   `anonymous` (`fill="var(--majora-chart-1)"`) at the bottom, `logged_in`
   (`fill="var(--majora-chart-2)"`) on top (the same colors as the Visits tab). The bar
   height is again `unique_visitors`.
4. **Tooltips** (custom `content`, reading `entry.payload`), one per chart:
   - the bucket's date range: clipped `start`–`end` formatted with `Intl.DateTimeFormat`
     (a single date when `start == end`), shared with the Visits tab's helper;
   - both series and the total (`unique_visitors`); chart 2 omits a hidden series;
   - a share as a whole percentage, **hidden when the total is 0**: chart 1 shows the
     **returning share** (`returning_visitors / unique_visitors`), chart 2 the **logged-in
     share** (`logged_in / unique_visitors`, also hidden when the audience filter is not
     `all`, since it is then 0 % or 100 % by construction).

Both charts use the same X axis (same buckets and labels) and are stacked vertically, so the
periods line up.

**Bucket labels** (X axis): the shared bucket-label helper introduced by the Visits tab
(`Intl.DateTimeFormat` from `start`: day and month for day / week buckets, month and year for
month buckets).

**Data points:** the controller maps `buckets` to a flat array, oldest first:
`{ start, end, label, unique_visitors, new_visitors, returning_visitors, anonymous,
logged_in, returningShare, loggedInShare }`, where both shares are `null` when
`unique_visitors == 0`. The chart helpers only plot.

**States:**

- **Loading:** `LoadingMessage` (also the `Suspense` fallback while the lazy chart chunk
  loads).
- **Error:** the shared error message used by the other staff pages.
- **Empty** (`totals.unique_visitors == 0`): both zero-filled charts are still drawn (flat
  bars at 0, so the time axis stays visible), with a "No visitors in this range" note above
  them. Before the #1478 deploy this is the normal state.

**Layering**, following the shared [Recharts conventions](shared-infrastructure.md#recharts-conventions):

- `pages/StaffStatisticsVisitors.jsx` — route `staffStatisticsVisitors`, replaces the shell
  placeholder, renders the summary row and the lazy `Charts.VisitorsNewReturningChart` and
  `Charts.VisitorsAudienceChart`;
- `pages/controllers/VisitorsController.js` — RequestStore read of the `visitors` quantity
  type with `StatisticsQuery.fromHash()`, maps the response to points, totals and the
  visible audience series (from `filters.audience`), unit-tested with fake setters;
- `charts/VisitorsNewReturningChart.jsx` and `charts/VisitorsAudienceChart.jsx` — the
  `data-testid` wrappers and `ResponsiveContainer`s, re-exported from `charts/index.js`;
  each smoke-tested for empty, single-point and normal data;
- `charts/helpers/VisitorsNewReturningChartHelper.jsx` and
  `charts/helpers/VisitorsAudienceChartHelper.jsx` — pure `render(points, { series })`
  returning the Recharts tree, plus the tooltip content;
- bucket-label, date-range and percentage formatting reuse the pure helpers in
  `pages/helpers/` (shared with the Visits tab), unit-tested.

**i18n:** the `staff_statistics_page` namespace, `visitors.*` keys (en + pt):
`visitors.title`, `visitors.unique_visitors`, `visitors.new`, `visitors.returning`,
`visitors.returning_share`, `visitors.anonymous`, `visitors.logged_in`,
`visitors.logged_in_share`, `visitors.new_returning_title`, `visitors.audience_title`,
`visitors.totals_note`, `visitors.first_visit_note`, `visitors.empty`. Series names in the
legends and tooltips reuse `visitors.new`, `visitors.returning`, `visitors.anonymous` and
`visitors.logged_in`.

## API

`GET /staff/statistics/visitors.json`, following
[API conventions](shared-infrastructure.md#api-conventions) exactly:

- view `backend/staff/views/staff_statistics_visitors.py` (`staff_statistics_visitors`), URL
  name `staff-statistics-visitors`, tests in
  `backend/staff/tests/staff_statistics_visitors_test.py`;
- `@restricted` (`X-Skip-Cache: true`), `@api_view(['GET'])`, `AllowAny`, inline
  `require_staff` first (`401` / `403`);
- shared query params and validation (`parse_statistics_filters`), no pagination params;
- not added to the Navi warm-up chain;
- a row is added to [`access-control/staff-statistics.md`](../../access-control/staff-statistics.md);
- frontend: a `visitors` quantity type in `staffStatisticsConfig.js`
  (`path: () => '/staff/statistics/visitors.json'`, same `regular` / `private` variant,
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
    {
      "start": "2026-09-28", "end": "2026-09-28",
      "unique_visitors": 19, "new_visitors": 12, "returning_visitors": 7,
      "anonymous": 15, "logged_in": 4
    },
    {
      "start": "2026-09-29", "end": "2026-09-29",
      "unique_visitors": 0, "new_visitors": 0, "returning_visitors": 0,
      "anonymous": 0, "logged_in": 0
    },
    {
      "start": "2026-09-30", "end": "2026-09-30",
      "unique_visitors": 16, "new_visitors": 6, "returning_visitors": 10,
      "anonymous": 11, "logged_in": 5
    }
  ],
  "totals": {
    "unique_visitors": 29,
    "new_visitors": 18,
    "returning_visitors": 11,
    "anonymous": 23,
    "logged_in": 6
  }
}
```

(Buckets shortened; a real response has one bucket per day of the range. Note that
`totals.unique_visitors` is less than the sum of the buckets, since visitors seen on several
days count once.)

| Key | Type |
|-----|------|
| `buckets[].start`, `buckets[].end` | inclusive local date (`YYYY-MM-DD`), clipped to the range |
| `unique_visitors`, `new_visitors`, `returning_visitors`, `anonymous`, `logged_in` (buckets and `totals`) | non-negative integer |

Queries (ORM only, no raw SQL):

1. **One `VisitQuery` pass:** `VisitQuery(filters).rows('started_at', 'session_id',
   'session__user_id')`. Each row's visitor key is `VisitQuery.visitor_key(user_id,
   session_id)`.
2. **First-visit-ever lookup** (skipped when step 1 returned no rows), restricted to the keys
   seen in step 1, ignoring the range and the `domain` / `audience` filters:
   - users: `Visit.objects.filter(session__user_id__in=<user ids from step 1>)
     .values('session__user_id').annotate(first=Min('started_at'))`;
   - anonymous: `Visit.objects.filter(session_id__in=<anonymous session ids from step 1>,
     session__user__isnull=True).values('session_id').annotate(first=Min('started_at'))`.

   This gives `first_visit[key]` for every in-range key. Both lookups are bounded by the
   in-range keys.
3. **Classification, in Python:**
   - per key, `first_bucket[key]` is `None` when `first_visit[key] < start_utc` (returning
     everywhere in the range), otherwise `calendar.key_for(first_visit[key])` (the bucket
     of the first visit; it is always in the range, since it is not after a matched visit);
   - the rows are grouped with `Series(BucketCalendar(filters)).group(rows, lambda row:
     row[0])`, then `map(reducer)` with a reducer that collects the bucket's distinct keys
     and counts: `unique_visitors` (`metrics.unique`), `new_visitors` (keys whose
     `first_bucket` is this bucket's `start`), `returning_visitors` (the rest), and
     `anonymous` / `logged_in` (keys by kind). `reducer([])` gives zeros, which zero-fills
     empty buckets;
   - `totals` comes from the distinct keys over all rows: `new_visitors` are the keys with a
     non-`None` `first_bucket`, `returning_visitors` the rest, and `anonymous` / `logged_in`
     by kind.

   Comparing bucket keys instead of timestamps reuses `BucketCalendar.key_for`, so DST and
   clipped buckets need no extra handling. This lives in a small aggregation class (e.g.
   `statistics/aggregation/visitors_series.py` — `VisitorsSeries(filters)` returning
   `(buckets, totals)`), so the view stays thin and the logic is tested in
   `statistics/tests/aggregation/`.

The range-level `new_visitors` / `returning_visitors` use the same rule as `OverviewTotals`
("any `Visit` before `start_utc`"); the implementation may share the lookup with it, but the
numbers must match Overview for the same filters either way.

## Edge cases

- **No backfill:** visit data starts at the #1478 deploy. Buckets before it are zero; the tab
  shows the empty note when the whole range predates it. Near the deploy almost every
  visitor shows as **new** (in the bucket of their first recorded visit), since earlier
  activity was never recorded; the summary row carries the "first visit recorded" note, as
  on Overview.
- **`user` filter:** only that user's visits, so every bucket has `unique_visitors` of `0` or
  `1` (and `logged_in` equal to it, `anonymous` always `0`). The user is new in the bucket
  of their first recorded visit, if it is in the range, and returning afterwards. An unknown
  or deleted user id returns zero-filled buckets (shared rule).
- **`user` with `audience=anonymous`:** valid, zero-filled buckets (shared rule); chart 2
  shows only the (empty) anonymous series, and the empty note is shown.
- **Anonymous visitor who later logs in:** counted as **two** visitor keys (the anonymous
  session and the user), each possibly new; consistent with "unique visitors is an
  estimate" ([data model](data-model.md#counting-rules-and-caveats)). In the bucket of the
  login both keys may appear, once in each audience.
- **Deleted users:** their sessions have `user = NULL`, so they become anonymous **session**
  keys: one per former session instead of one per user, and their history is looked up per
  session. Unique visitors may rise slightly after a deletion. Accepted (shared caveat).
- **Domain filter:** narrows the in-range visits only; the first-visit lookup looks at **any**
  domain. A visitor whose first visit in the range was on another domain is new in
  `totals` but may be returning in every bucket of the filtered domain, so with a domain
  filter the buckets' `new_visitors` can add up to less than `totals.new_visitors`. Without
  a domain filter they add up exactly.
- **First bucket clipped to `from`:** with week or month granularity, the first bucket starts
  at `from`, so "before the bucket start" is "before the range start" there, consistent with
  `totals`. The last bucket may also be clipped; the tooltip shows the clipped range.
- **DST:** buckets are local calendar days (23 h or 25 h on transition days), per the shared
  `BucketCalendar`; the classification compares bucket keys, so it inherits that.
- **Open visits:** a visit is counted in the bucket it started in; a visit that started
  before `from` and continues into the range is not counted, but it does make its visitor
  **returning** if they have another visit in the range.
- **Proxy-cached requests** never reach Django, so anonymous visitors who only hit cached
  public routes are invisible (shared caveat); the anonymous series is a lower bound.
- **Null domains** are only reachable with `domain=unknown` (shared caveat).

## Open questions

- **Deferred:** comparison with the previous period, as on Overview.
- **Deferred:** a "returning within N days" (retention) view. Not in the first version;
  "returning" here only means "seen before", with no recency window.
- **Resolved:** new vs returning per bucket uses the **bucket** start, and `totals` use the
  **range** start (Overview's definition) (#1485 discussion).
- **Resolved:** the anonymous vs logged-in split counts distinct **visitor keys**, not
  visits (the Visits tab counts visits).

## Implementation sub-issues

_Created by #1485 under #1477._

| Issue | Layer | Implements |
|-------|-------|------------|
| #1509 | Backend | [Metrics](#metrics), [API](#api) (`visitors.json`, `VisitorsSeries`, tests, access-control row); needs #1498 |
| #1510 | Frontend | [Filters](#filters), [Chart and layout](#chart-and-layout) (summary row, two stacked-bar charts, tooltips, states), `visitors` quantity type, translations; needs #1499, #1500 and #1509 |
