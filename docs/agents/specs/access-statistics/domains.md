# Domains tab

> **Status:** specced · **Owner:** #1487 · **Route:** `/staff/statistics/domains` · Back to
> the [hub](../access-statistics.md)

## Purpose

Per-domain comparison, as a chart and a table, including "unknown". Domain is also a filter
on every tab.

## Decided

- Sessions with `domain = NULL` are shown as an **"unknown"** row, never dropped (see
  [data model](data-model.md)).
- Domain is also a shared filter on every tab (see
  [shared infrastructure](shared-infrastructure.md)).
- **Metrics per domain:** visits (split into anonymous and logged-in), unique visitors (by
  visitor key), and average and median visit duration. They reuse the shared `metrics`
  helpers and the Overview / Duration definitions and rounding (#1487 discussion).
- **`totals`** is computed over **all** matched visits, never summed from the rows. A
  visitor seen on several domains counts once in `totals.unique_visitors` but once per
  domain in the rows (see [Metrics](#metrics)).
- **Whole range only:** no buckets, no time series. There is one horizontal stacked bar
  chart (visits per domain, anonymous and logged-in) and a table with every metric under it.
  The tab **hides the granularity control**, like Overview.
- **Grouping:** one row per `Domain` (hostname), matching the shared domain filter. Each row
  also shows its `DomainGroup` name.
- **Rows:** every configured `Domain` gets a row, zero-filled when it has no visits
  (domains are a small, admin-managed set), plus the **"unknown"** row, always listed
  **last**.
- **Domain filter:** applies as on every other tab, so a selected domain leaves a single
  row.
- **Row click** opens the Overview tab with `?domain=<id|unknown>`, keeping the other
  filters (`statisticsHref`).
- A **dedicated** `GET /staff/statistics/domains/summary.json` endpoint (following
  `staff/cache/summary.json`), distinct from the shared `domains.json` support endpoint. It
  uses the standard envelope, with a `domains` list instead of `buckets` (see [API](#api)).
- Implementation is a **backend + frontend pair**, like the other tabs (see
  [Implementation sub-issues](#implementation-sub-issues)).

## Metrics

All metrics cover the visits matched by the shared filters: `Visit.started_at` inside the
range (the half-open UTC interval of
[API conventions](shared-infrastructure.md#query-params)), combined with the `user`,
`domain` and `audience` filters on the visit's session. A visit belongs to the domain of its
**session** (`session__domain_id`, `NULL` → "unknown"). "Visitor key" is the
[data model](data-model.md#visitor-key) key: `('user', user_id)` when the session has a
user, otherwise `('session', session_id)`.

Per visit: **duration** = `last_seen_at − started_at` in whole seconds.

| Key | Definition | Zero-visit row |
|-----|------------|----------------|
| `visits` | `metrics.count` of the matched visits: always `anonymous + logged_in` | `0` |
| `anonymous` | Matched visits whose session has no user (`session__user_id` is null) | `0` |
| `logged_in` | Matched visits whose session has a user (`session__user_id` is not null) | `0` |
| `unique_visitors` | `metrics.unique` of the visitor keys (`VisitQuery.visitor_key`) | `0` |
| `average_duration_seconds` | `metrics.average` of the durations, rounded to the nearest integer | `null` |
| `median_duration_seconds` | `metrics.median` of the durations, rounded to the nearest integer | `null` |

Each row also carries its identity:

| Key | Configured domain | "Unknown" row |
|-----|-------------------|---------------|
| `id` | `Domain.id` (integer) | `"unknown"` |
| `domain` | `Domain.domain` (hostname) | `null` |
| `group` | `Domain.domain_group.name` | `null` |

- The six metric keys appear on every row and in `totals`.
- `totals` is computed over **all** matched visits with the same reducer, never from the row
  values. `totals.visits`, `totals.unique_visitors` and `totals.average_duration_seconds`
  therefore equal Overview's `visits`, `unique_visitors` and `average_duration_seconds`,
  and `totals.median_duration_seconds` equals Duration's, for the same filters.
- `totals.visits`, `totals.anonymous` and `totals.logged_in` equal the sums of the rows
  (each visit has exactly one domain or none). **`unique_visitors` does not:** a visitor
  seen on several domains (e.g. a user logged in on two brands) counts once per domain in
  the rows but once in `totals`, so the per-row values can add up to more than
  `totals.unique_visitors`.
- **Order:** `visits` descending, then `domain` ascending (so zero-visit rows are
  alphabetical); the "unknown" row is always **last**, whatever its count.
- The **logged-in share** (`logged_in / visits`) is computed on the **client**, like the
  Visits tab, and is `null` when `visits == 0`. It is not in the response.

## Filters

- **Apply:** date range, `user`, `domain` and `audience`, all with the shared semantics.
- **Granularity:** irrelevant (no time series). The endpoint accepts, validates and echoes
  it through the shared parser (so a URL carried from another tab never errors), but
  ignores it. The filter bar **hides** the granularity control
  (`showGranularity={false}`, as on Overview); the `granularity` URL param is kept as-is so
  it carries over to other tabs.
- **Domain filter** — which rows the response holds:

  | `domain` | Rows |
  |----------|------|
  | any (omitted) | every configured `Domain` (zero-filled), plus the "unknown" row last |
  | `<id>` of an existing `Domain` | that domain's row only (zero-filled if it has no visits) |
  | `<id>` with no `Domain` row (well-formed, deleted or never existed) | none: an empty `domains` list and zero totals (shared "unknown id is not an error" rule) |
  | `unknown` | the "unknown" row only |

- **Audience:** the API always returns both `anonymous` and `logged_in`. With
  `audience=anonymous`, every `logged_in` value is `0`, and vice versa. The chart and the
  table **hide** the filtered-out series / column, like Visits.
- No tab-specific filters, no pagination.

## Chart and layout

Rendered inside `StaffStatisticsShell`, below the filter bar and tab nav:

1. **Totals line:** visits, anonymous and logged-in (following the audience filter), unique
   visitors, average and median duration. Numbers use `Intl.NumberFormat` in the browser
   locale; durations use Overview's duration formatter (`Xm Ys`, `Xh Ym` from one hour,
   `—` when `null`).
2. **Chart:** a horizontal Recharts `BarChart` (`layout="vertical"`), in a
   `<ResponsiveContainer width="100%" height={height}>` wrapped in
   `<div data-testid="statistics-domains-chart">`:
   - **height** grows with the row count: `max(300, rows × 32 + 60)` px, so every domain
     label stays readable (domains are a small set; no cap);
   - category `YAxis` (`type="category"`, `dataKey="label"`, wide enough for hostnames)
     over the rows in the API order, "unknown" at the bottom; numeric `XAxis`
     (`type="number"`, `allowDecimals={false}`);
   - two `Bar`s with the same `stackId="visits"`: `anonymous`
     (`fill="var(--majora-chart-1)"`) and `logged_in` (`fill="var(--majora-chart-2)"`), so
     the bar length is the total; the series filtered out by `audience` is hidden with its
     legend entry, like Visits;
   - `CartesianGrid` with `stroke="var(--majora-chart-grid)"`, axes with
     `var(--majora-chart-axis)`; a `Legend`; `isAnimationActive={false}`; composition order
     per the [Recharts conventions](shared-infrastructure.md#charting).
3. **Tooltip** (custom `content`, reading `entry.payload`): the domain label, its group
   (omitted for "unknown"), anonymous, logged-in and total visits (hidden series omitted),
   and the logged-in share (whole percentage, hidden when `visits == 0` or the audience
   filter is not `all`).
4. **Table** under the chart (Bootstrap `Table`, `hover`, `responsive`):

   | Column | Value |
   |--------|-------|
   | Domain | `domain`, or the translated "Unknown" label |
   | Group | `group`, or `—` |
   | Visits | `visits` |
   | Anonymous | `anonymous` (hidden with `audience=logged_in`) |
   | Logged-in | `logged_in` (hidden with `audience=anonymous`) |
   | Unique visitors | `unique_visitors` |
   | Avg duration | `average_duration_seconds`, duration formatter |
   | Median duration | `median_duration_seconds`, duration formatter |

   - **No totals row** (the totals line covers it, and `unique_visitors` doesn't sum).
   - **Client-side sorting:** clicking a header sorts by that column (toggle ascending /
     descending, with an indicator). The default is the API order. The "unknown" row stays
     **pinned last** in every sort; `null` durations sort after numbers. The sort is
     component state, not in the URL.
   - **Row click:** sets `window.location.hash =
     statisticsHref('/staff/statistics', { ...filters, domain: row.id })`, opening Overview
     for that domain (or `unknown`) with the other filters kept. Rows are links
     (`role="link"`, keyboard accessible).

**Labels:** the chart and table label is the hostname; the "unknown" row uses the
translated `domains.unknown` label.

**Data points:** the controller maps `domains` to rows, in API order:
`{ id, domain, group, label, anonymous, logged_in, visits, unique_visitors,
average_duration_seconds, median_duration_seconds, loggedInShare, unknown }`, where
`label` is the hostname or the translated unknown label, `unknown` is `id === 'unknown'`,
and `loggedInShare` is `null` when `visits == 0`; it also exposes `totals` and the visible
series (from `filters.audience`). Sorting is a pure helper over these rows. The chart helper
only plots.

**States:**

- **Loading:** `LoadingMessage` (also the `Suspense` fallback while the lazy chart chunk
  loads).
- **Error:** the shared error message used by the other staff pages.
- **Empty** (`totals.visits == 0`): the chart and table are still drawn with the zero rows
  (every configured domain and "unknown"), with a "No visits in this range" note above
  them. An empty `domains` list (unknown domain id) shows the note and no chart or table.

**Layering**, following the shared [Recharts conventions](shared-infrastructure.md#recharts-conventions):

- `pages/StaffStatisticsDomains.jsx` — route `staffStatisticsDomains`, replaces the shell
  placeholder, renders the totals line, the lazy `Charts.DomainsChart` and the table;
- `pages/controllers/DomainsController.js` — RequestStore read of the `domainsSummary`
  quantity type with `StatisticsQuery.fromHash()`, maps the response to rows, `totals` and
  the visible series, unit-tested with fake setters;
- `pages/elements/StatisticsDomainsTable.jsx` — the sortable table and row navigation;
- `pages/helpers/domainsSort.js` — pure sort helper (unknown pinned last, `null` last),
  unit-tested;
- `charts/DomainsChart.jsx` — the `data-testid` wrapper and `ResponsiveContainer`
  (height from the row count), re-exported from `charts/index.js`; smoke-tested for empty,
  single-row and normal data;
- `charts/helpers/DomainsChartHelper.jsx` — pure `render(rows, { series })` returning the
  Recharts tree, plus the tooltip content;
- reuses Overview's duration formatter and `statisticsHref`.

**i18n:** the `staff_statistics_page` namespace, `domains.*` keys (en + pt):
`domains.title`, `domains.unknown`, `domains.domain`, `domains.group`, `domains.visits`,
`domains.anonymous`, `domains.logged_in`, `domains.logged_in_share`,
`domains.unique_visitors`, `domains.average_duration`, `domains.median_duration`,
`domains.chart`, `domains.empty`. Series names in the legend and tooltip reuse
`domains.anonymous` / `domains.logged_in`.

## API

`GET /staff/statistics/domains/summary.json`, following
[API conventions](shared-infrastructure.md#api-conventions), with a nested `<name>`
(`domains/summary`, like `staff/cache/summary.json`) so it can't clash with the shared
`domains.json` support endpoint:

- view `backend/staff/views/staff_statistics_domains_summary.py`
  (`staff_statistics_domains_summary`), URL name `staff-statistics-domains-summary`, tests
  in `backend/staff/tests/staff_statistics_domains_summary_test.py`;
- `@restricted` (`X-Skip-Cache: true`), `@api_view(['GET'])`, `AllowAny`, inline
  `require_staff` first (`401` / `403`);
- shared query params and validation (`parse_statistics_filters`), no pagination params;
- not added to the Navi warm-up chain;
- a row is added to [`access-control/staff-statistics.md`](../../access-control/staff-statistics.md);
- frontend: a `domainsSummary` quantity type in `staffStatisticsConfig.js`
  (`path: () => '/staff/statistics/domains/summary.json'`, same `regular` / `private`
  variant, `permission: null`).

Response: the standard envelope with `domains` instead of `buckets`:

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
  "domains": [
    {
      "id": 3, "domain": "majora.example.com", "group": "Majora",
      "visits": 301, "anonymous": 262, "logged_in": 39, "unique_visitors": 118,
      "average_duration_seconds": 288, "median_duration_seconds": 102
    },
    {
      "id": 5, "domain": "brand.example.org", "group": "Brand",
      "visits": 97, "anonymous": 90, "logged_in": 7, "unique_visitors": 41,
      "average_duration_seconds": 240, "median_duration_seconds": 88
    },
    {
      "id": 7, "domain": "staging.example.com", "group": "Majora",
      "visits": 0, "anonymous": 0, "logged_in": 0, "unique_visitors": 0,
      "average_duration_seconds": null, "median_duration_seconds": null
    },
    {
      "id": "unknown", "domain": null, "group": null,
      "visits": 14, "anonymous": 14, "logged_in": 0, "unique_visitors": 9,
      "average_duration_seconds": 31, "median_duration_seconds": 0
    }
  ],
  "totals": {
    "visits": 412, "anonymous": 366, "logged_in": 46, "unique_visitors": 158,
    "average_duration_seconds": 274, "median_duration_seconds": 98
  }
}
```

(Here `totals.unique_visitors` is `158` while the rows add up to `168`: ten visitors were
seen on two domains.)

| Key | Type |
|-----|------|
| `domains[].id` | positive integer, or `"unknown"` |
| `domains[].domain`, `domains[].group` | string, or `null` for the unknown row |
| `visits`, `anonymous`, `logged_in`, `unique_visitors` (rows and `totals`) | non-negative integer |
| `average_duration_seconds`, `median_duration_seconds` (rows and `totals`) | non-negative integer, or `null` when there are no visits |

Queries (ORM only, no raw SQL):

1. **One `VisitQuery` pass:** `VisitQuery(filters).rows('session__domain_id', 'session_id',
   'session__user_id', 'started_at', 'last_seen_at')`, grouped by `session__domain_id` in
   Python (`None` → the unknown row). A reducer returns the six keys from `metrics.count` /
   `unique` / `average` / `median` and `VisitQuery.visitor_key`; `reducer([])` gives `0`
   counts and `null` durations, which zero-fills rows. `totals` is the same reducer over
   **all** rows.
2. **One `Domain` query:** `Domain.objects.select_related('domain_group')`, filtered to
   `id=filters.domain` when the filter is an id, skipped when it is `unknown`. It gives the
   zero-filled row list and each row's `domain` / `group`.

The unknown row is appended when the domain filter is unset or `unknown`. Rows are then
sorted per [Metrics](#metrics). This lives in a small aggregation class
(`statistics/aggregation/domains_summary.py` — `DomainsSummary(filters)` returning
`(domains, totals)`), so the view stays thin and the logic is tested in
`statistics/tests/aggregation/`. The serialized key is `domains`.

## Edge cases

- **Unknown row:** sessions with `domain = NULL` (unrecognized host). With no domain filter
  it is always listed, even with zero visits, so its absence never hides a problem; with
  `domain=<id>` it is not listed.
- **Deleted `Domain`:** `Session.domain` is `on_delete=SET_NULL` (and deleting a
  `DomainGroup` cascades to its domains), so a deleted domain's past sessions move to the
  **unknown** row. Its row disappears; totals don't change. A link with its old id returns an
  empty `domains` list (see [Filters](#filters)).
- **Visitors on several domains:** counted on each domain's row, once in `totals` (see
  [Metrics](#metrics)). An anonymous visitor's session is tied to one domain, so this mostly
  affects logged-in users.
- **Deleted users** (sessions with `user = NULL`) count as anonymous (shared caveat).
- **Open visits** count with their current duration; a single-hit visit has duration `0`
  and is included in the average and the median, as on Duration.
- **Visits that started before `from`** are not counted, even if they continue into the
  range.
- **Login is a visit boundary:** a browsing session where the visitor logs in is split into
  an anonymous and a logged-in visit (see [data model](data-model.md#visit-is-the-activity)),
  both on the same domain.
- **Proxy-cached requests** never reach Django, so anonymous visits on cached public routes
  are undercounted (shared caveat); domains with mostly cached traffic look smaller.
- **No backfill:** visit data starts at the #1478 deploy; earlier ranges show zero rows and
  the empty note.
- **`user` filter:** only that user's visits; every `anonymous` value is `0`. An unknown or
  deleted user id returns zero rows (shared rule). **`user` with `audience=anonymous`:**
  valid, zero rows.
- **Domain renamed:** rows use the current hostname; history is not split.

## Open questions

- **Deferred:** a time series per domain (e.g. visits per bucket, one series per domain).
- **Deferred:** a `DomainGroup` rollup (one row per group).
- **Deferred:** comparison with the previous period, as on Overview.

## Implementation sub-issues

Created by #1487 under #1477.

| Issue | Layer | Implements |
|-------|-------|------------|
| #1516 | Backend | [Metrics](#metrics), [Filters](#filters) (row selection), [API](#api) (`domains/summary.json`, `DomainsSummary`, tests, access-control row); needs #1498 |
| #1517 | Frontend | [Filters](#filters), [Chart and layout](#chart-and-layout) (horizontal stacked bars, sortable table, row click, states), `domainsSummary` quantity type, translations; needs #1499, #1500 and #1516 |
