# Overview tab

> **Status:** specced · **Owner:** #1483 · **Route:** `/staff/statistics` · Back to the
> [hub](../access-statistics.md)

## Purpose

The landing tab: KPI tiles for the selected range (visits, unique visitors, logged-in users,
average visit duration, new vs returning). Each tile links to its tab.

## Decided

- Overview is the **landing** tab of the statistics page.
- KPI tiles are plain Bootstrap cards and don't need Recharts (see
  [shared infrastructure](shared-infrastructure.md)).
- Implemented **last**, since it reuses the other tabs' aggregations.
- **New vs returning** is based on the visitor's **first visit ever** (#1483 discussion).
- **Previous-period comparison** is **deferred** (see [Open questions](#open-questions)).
- A **dedicated** `GET /staff/statistics/overview.json` endpoint, returning `totals` only
  (see [API](#api)). The tab makes one request and never calls the other tabs' endpoints.

## Metrics

All metrics cover the visits matched by the shared filters: `Visit.started_at` inside the
range (the half-open UTC interval of
[API conventions](shared-infrastructure.md#query-params)), combined with the `user`,
`domain` and `audience` filters on the visit's session. "Visitor key" is the
[data model](data-model.md#visitor-key) key: `('user', user_id)` when the session has a user,
otherwise `('session', session_id)`.

| Tile | `totals` key | Definition | Empty range |
|------|--------------|------------|-------------|
| Visits | `visits` | `metrics.count` of the matched `Visit` rows | `0` |
| Unique visitors | `unique_visitors` | `metrics.unique` of the visitor keys of the matched visits | `0` |
| Logged-in users | `logged_in_users` | Number of distinct non-null `session__user_id` among the matched visits | `0` |
| Average visit duration | `average_duration_seconds` | `metrics.average` of `last_seen_at − started_at` (whole seconds) over the matched visits, rounded to the nearest integer | `null` |
| New visitors | `new_visitors` | Visitor keys of the matched visits with **no** `Visit` at all before `start_utc` | `0` |
| Returning visitors | `returning_visitors` | Visitor keys of the matched visits with **at least one** `Visit` before `start_utc` | `0` |

- `new_visitors + returning_visitors == unique_visitors`, always.
- **First visit ever:** the earlier-visits lookup ignores the range and the `domain` /
  `audience` filters: a visitor key is *returning* if it has any `Visit` anywhere before
  the range start (any domain). A visitor's key is fixed per session (login rotates to a
  new `Session` row, see [data model](data-model.md#visit-is-the-activity)), so its history
  is well defined. Since visits that start inside the range all lie after `start_utc`, a
  key is *new* exactly when its earliest `Visit` falls inside the range.
- The tile for new vs returning shows both numbers (and the share of returning visitors as
  a percentage of unique visitors, computed on the client; hidden when
  `unique_visitors == 0`).
- A visit is counted in the range it **started** in, so a visit that started just before
  `from` and continues into the range is not counted (shared convention).

## Filters

- **Apply:** date range, `user`, `domain`, `audience`, all with the shared semantics.
- **Granularity:** irrelevant (no time series). The endpoint still accepts, validates and
  echoes it through the shared parser (so a URL carried from another tab never errors), but
  ignores it. The filter bar **hides** the granularity control on this tab (a prop on
  `StaffStatisticsFilterBar`, e.g. `showGranularity={false}`); the `granularity` URL param is
  kept as-is so it carries over when the user switches to another tab.
- No tab-specific filters, no pagination.

## Chart and layout

No chart. A responsive grid of Bootstrap cards (`Row` / `Col`, `xs={12} sm={6} lg={4}`),
rendered inside `StaffStatisticsShell`, in this order:

| # | Tile | Value shown | Links to |
|---|------|-------------|----------|
| 1 | Visits | `visits` | Visits tab (`/staff/statistics/visits`) |
| 2 | Unique visitors | `unique_visitors` | Visitors tab (`/staff/statistics/visitors`) |
| 3 | Logged-in users | `logged_in_users` | Users tab (`/staff/statistics/users`) |
| 4 | Average visit duration | `average_duration_seconds`, formatted as `Xm Ys` (`Xh Ym` from one hour; `—` when `null`) | Duration tab (`/staff/statistics/duration`) |
| 5 | New vs returning | `new_visitors` / `returning_visitors` (plus the returning share) | Visitors tab (`/staff/statistics/visitors`) |

- Each card is a link (`<a href>` around the card body, or a stretched link) to
  `statisticsHref(tabPath, filters)`, so the current filters carry over (no `page`).
- Numbers use `Intl.NumberFormat` in the browser locale.
- While loading, the grid shows `LoadingMessage`; on a request error, the shared error
  message used by the other staff pages.
- Strings go in the `staff_statistics_page` i18n namespace (`overview.*` keys).
- Layering follows the shared layout: `pages/StaffStatisticsOverview.jsx` (route
  `staffStatistics`), `pages/controllers/OverviewController.js` (RequestStore read of the
  `overview` quantity type with `StatisticsQuery.fromHash()`), and an
  `elements/StatisticsKpiTile.jsx` card element; the duration formatter is a pure helper in
  `pages/helpers/`, unit-tested.

## API

`GET /staff/statistics/overview.json`, following
[API conventions](shared-infrastructure.md#api-conventions) exactly:

- view `backend/staff/views/staff_statistics_overview.py` (`staff_statistics_overview`),
  URL name `staff-statistics-overview`, tests in
  `backend/staff/tests/staff_statistics_overview_test.py`;
- `@restricted` (`X-Skip-Cache: true`), `@api_view(['GET'])`, `AllowAny`, inline
  `require_staff` first (`401` / `403`);
- shared query params and validation (`parse_statistics_filters`), no pagination params;
- not added to the Navi warm-up chain;
- a row is added to [`access-control/staff-statistics.md`](../../access-control/staff-statistics.md).

Response: the standard envelope **without `buckets`**:

```json
{
  "filters": {
    "from": "2026-09-04",
    "to": "2026-10-03",
    "tz": "Europe/Lisbon",
    "granularity": "day",
    "requested_granularity": "auto",
    "user": null,
    "domain": null,
    "audience": "all"
  },
  "totals": {
    "visits": 412,
    "unique_visitors": 158,
    "logged_in_users": 23,
    "average_duration_seconds": 274,
    "new_visitors": 97,
    "returning_visitors": 61
  }
}
```

| Key | Type |
|-----|------|
| `visits`, `unique_visitors`, `logged_in_users`, `new_visitors`, `returning_visitors` | non-negative integer |
| `average_duration_seconds` | non-negative integer, or `null` when there are no visits |

Queries (ORM only, no raw SQL):

1. **One `VisitQuery` pass:** `VisitQuery(filters).rows('started_at', 'last_seen_at',
   'session_id', 'session__user_id')`. Every metric except new vs returning is computed in
   Python from these rows with the shared `metrics` helpers and `VisitQuery.visitor_key`.
2. **Earlier-visits lookup** (skipped when step 1 returned no rows): the visitor keys that
   already had a `Visit` before `start_utc`, restricted to the keys seen in step 1, with
   `.values_list(...).distinct()`:
   - users: `Visit.objects.filter(started_at__lt=start_utc,
     session__user_id__in=<user ids from step 1>)` → distinct `session__user_id`;
   - anonymous: `Visit.objects.filter(started_at__lt=start_utc,
     session_id__in=<anonymous session ids from step 1>, session__user__isnull=True)` →
     distinct `session_id`.

   `returning_visitors` is the number of step-1 keys found here; `new_visitors` is the rest.
   Both lookups use the `started_at` index and are bounded by the in-range keys. The
   computation lives in a small aggregation class (e.g.
   `statistics/aggregation/overview_totals.py` — `OverviewTotals(filters)`), so the view
   stays thin and the logic is tested in `statistics/tests/aggregation/`.

## Edge cases

- **No backfill:** visit data starts at the #1478 deploy. Ranges before it return zeros
  (`average_duration_seconds: null`), and ranges near it show almost every visitor as
  **new**, since their earlier activity was never recorded. The tab shows a short note under
  the new vs returning tile explaining that "new" means "first visit recorded".
- **User filter:** `logged_in_users` and `unique_visitors` are `0` or `1`. An unknown or
  deleted user id returns zero totals (shared rule).
- **`audience=anonymous`:** `logged_in_users` is always `0`; new vs returning is computed for
  anonymous session keys only. **`audience=logged_in`:** `unique_visitors ==
  logged_in_users`.
- **`user` with `audience=anonymous`:** valid, zero totals (shared rule).
- **Domain filter:** narrows the in-range visits only; whether a visitor is returning still
  looks at earlier visits on **any** domain (first visit ever).
- **Anonymous visitor who later logs in:** counted as two visitor keys (the anonymous session
  and the user), both possibly new; consistent with "unique visitors is an estimate"
  ([data model](data-model.md#counting-rules-and-caveats)).
- **Deleted users** (sessions with `user = NULL`) count as anonymous keys, and **null
  domains** are only reachable with `domain=unknown` (shared caveats).
- **Open visits:** a visit still in progress counts with its current duration
  (`last_seen_at − started_at`); a single-hit visit has duration `0` and is included in the
  average.

## Open questions

- **Deferred:** comparison with the previous period (e.g. deltas against the preceding range
  of the same length). Not in the first version; it would add a second pass over the
  previous range and `previous` keys in `totals`.

## Implementation sub-issues

Created by #1483 under #1477. The Overview tab is implemented **last**, after the other
tabs.

| Issue | Layer | Implements |
|-------|-------|------------|
| #1503 | Backend | [API](#api) (`overview.json`, `OverviewTotals`, tests, access-control row); needs #1498 |
| #1504 | Frontend | [Filters](#filters) (granularity hidden), [Chart and layout](#chart-and-layout), translations; needs #1499 and #1503 |
