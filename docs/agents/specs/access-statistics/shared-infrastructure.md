# Shared infrastructure

> **Status:** specced · **Owner:** #1482 · Back to the [hub](../access-statistics.md)

Everything the seven tabs share: navigation, the filter bar, URL query state, granularity,
API conventions, the Python aggregator, charting and access-control docs. Performance
decisions live here, rather than on their own page, because they directly shape the
aggregator. See also the [data model](data-model.md) and
[access and security](access-and-security.md).

## Decided

Settled in #1477 (Tabs, Filters and charting, Performance & security).

### Navigation

- One route per tab under `/staff/statistics`; Overview is the landing tab
  (`/staff/statistics`).
- Routes are registered in `HashRouteResolver.js` next to `/staff/dashboard`, gated by
  `staffOrSuperuser` (see [access and security](access-and-security.md)).
- A new "Access statistics" entry in the staff menu.

### Aggregation

- **On the fly** over `Visit`, with **no precomputed rollups** until a measured need
  appears. Traffic is modest, and with indexes plus the range cap, live queries are enough.
- **Bucketing happens in Python, not in MySQL:**
  - endpoints fetch only the needed columns for the capped range (`values_list(...)`);
  - a **model-level aggregator** class (keeping views thin) converts timestamps with
    `zoneinfo` to the requested zone, groups them by day / ISO week / month, zero-fills empty
    buckets, and computes counts, unique visitors, average / **median** duration and
    histograms;
  - why: DB-side `TruncDay(..., tzinfo=…)` relies on MySQL `CONVERT_TZ`, which needs MySQL's
    time zone tables loaded in every environment (the official image doesn't load them, and
    without them it silently returns `NULL`), and MySQL has no `MEDIAN`. Python-side
    bucketing is DST-correct, DB-agnostic and easy to unit-test;
  - revisit (DB-side bucketing or rollups) only if it measures slow.
- **Time zone:** data is stored in UTC; the frontend sends the browser's IANA zone and the
  backend buckets in it.
- **Zero-filled** buckets, so charts have no gaps.
- **Bounded responses:**
  - a range cap per request;
  - the Visit list paginated per [`pagination.md`](../../pagination.md);
  - the Users ranking paginated (no hard cap: the top N is the current page, see
    [Users](users.md)).
- **No server-side caching** at first. Responses are restricted, so the proxy doesn't cache
  them; `memory_cache` remains an option later.
- The write cost of visit tracking is handled in #1478: exact `hits` via one atomic
  `UPDATE` per request, and throttled `Session.last_seen_at` writes (see
  [data model](data-model.md#visit-is-the-activity)).

### Filter bar

One shared component, used by every tab:

| Filter | Control | Default |
|--------|---------|---------|
| Date range | Presets (7 days, 30 days, 90 days, 12 months) plus **Custom** with two native `<input type="date">` fields (React Bootstrap `Form.Control`, no datepicker dependency) | Last 30 days |
| User | Searchable select, reusing the staff users endpoint (`staff/users.json`) | Any |
| Domain | Select from the existing domains, plus "unknown" | Any |
| Audience | All / Anonymous / Logged-in | All |
| Granularity | Auto, with an optional override (day / week / month) | Auto |

- **Filter state lives in the URL query** of the hash route, so switching tabs keeps the
  filters, links can be shared, and Users-tab clicks just set `?user=<id>`.
- **Auto granularity:** a range of 31 days or less uses days, up to about 6 months uses
  **ISO weeks** (Monday start), longer ranges use months (exact thresholds in
  [Granularity and range cap](#granularity-and-range-cap)).

### Charting

- **Recharts 3**, following navi's (scylla frontend) memory-usage chart
  (`MemoryUsageChartHelper.jsx` / `MemoryUsageChart.jsx` / `MemoryChartController.jsx`).
- **Lazy-loaded** via dynamic `import()` in the staff statistics route chunk, so non-staff
  users never download it. Adding `recharts` (via
  `docker-compose run --rm majora_fe yarn add`) is part of the first charting
  implementation sub-issue.
- **Three layers per chart:**
  - a client / RequestStore read, fetch only;
  - a controller: a plain class with no JSX that turns API buckets into a flat,
    ready-to-plot array, unit-tested with fake setters;
  - a helper with a pure `render(points, …)` returning the Recharts tree.
- **Data shape:** a flat array of objects, oldest first, with ready-to-plot numbers; extra
  fields (e.g. raw counts behind a percentage) are kept on each point for tooltips
  (`entry.payload`). Buckets are zero-filled, so a categorical X axis is correct.
- **Composition order:** `CartesianGrid` → axes → `Tooltip` → series (`Line` / `Bar` /
  `Area`) → markers. `isAnimationActive={false}`, and `dot={false}` on dense series.
- **Colors** are passed as CSS variables (`stroke="var(--…)"`), not class names.
- **Tests:** chart components get **smoke tests only**, asserting a `data-testid` wrapper
  renders for empty, single-point and normal data. The real logic lives in controllers and
  is fully unit-tested.
- **Dates** are formatted with `Intl.DateTimeFormat` in the browser time zone; `date-fns`
  only if it proves necessary.
- Overview KPI tiles are plain Bootstrap cards and don't need Recharts.

## Specced

Resolved by #1482. Each section names the existing file or pattern it follows. Tab pages
(#1483 to #1489) build on these conventions and define only their own endpoint, payload and
chart.

### Navigation and routes

- **Staff menu entry:** add `adminItem('staff-statistics', 'staff/statistics',
  'header.nav_staff_statistics')` to `NAV_LINK_REGISTRY` in
  `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx`, after
  `staff-photos`. It inherits `IS_ADMIN` (staff or superuser), like the other staff items.
  The translation key goes in `assets/i18n/{en,pt}/common.yaml` next to the other
  `nav_staff_*` keys ("Access statistics" / "Estatísticas de acesso").
- **No staff-dashboard card.** `dashboardCardConfig.js` holds system-health cards (memory
  cache, disk cache, crawler debug); the statistics page is reached through the menu only.
- **Routes:** seven entries in the `ROUTES` array of
  `frontend/assets/js/utils/routing/HashRouteResolver.js`, placed after
  `['/staff/photos', 'staffPhotos']`. `Router.resolve` returns the first match, so the tab
  routes come **before** the bare landing route:

  | Path | Route key | Tab |
  |------|-----------|-----|
  | `/staff/statistics/visits` | `staffStatisticsVisits` | Visits |
  | `/staff/statistics/visitors` | `staffStatisticsVisitors` | Visitors |
  | `/staff/statistics/duration` | `staffStatisticsDuration` | Duration |
  | `/staff/statistics/domains` | `staffStatisticsDomains` | Domains |
  | `/staff/statistics/users` | `staffStatisticsUsers` | Users |
  | `/staff/statistics/visit-list` | `staffStatisticsVisitList` | Visit list |
  | `/staff/statistics` | `staffStatistics` | Overview (landing) |

  Each key maps to its page component in the `PAGES` object of
  `frontend/assets/js/components/helpers/AppHelper.jsx`, like `staffDashboard`.
- **Gates:** one `[{ kind: 'staffOrSuperuser' }]` entry per route key above in
  `frontend/assets/js/utils/access/accessRouteConfig.js`, next to `staffDashboard` and
  `staffPhotos`.
- **Tab shell:** a `StaffStatisticsShell` element renders, in order, the page title, the
  filter bar and the tab nav, then its children (the tab body). Every tab page renders its
  body inside it. The tab nav (`StaffStatisticsTabs`) follows `StaffPhotoTabs.jsx`: a plain
  Bootstrap `<ul className="nav nav-tabs flex-wrap mb-3">` with `<a className="nav-link">`
  items and `aria-current` on the active one. Unlike `StaffPhotoTabs` (whose hrefs drop the
  query), each tab `href` is built with `statisticsHref(tabPath, filters)` (below), so the
  current filters carry across tabs. `page` / `per_page` (and the `sort` of the Users and
  Visit list tabs) are **not** carried: switching tabs resets pagination and sorting.
- Every hash change remounts the page (`AppHelper.render` keys its fragment on the hash), so
  a filter change or tab switch is just a new hash. There is no in-page query state.

### Filter bar controls

`StaffStatisticsFilterBar`, rendered by the shell, with the controls and defaults of the
"Decided" table. Its state is the URL query (below); applying a filter writes a new hash.

- **Date range:** a select of presets (`7d`, `30d`, `90d`, `12m`, `custom`). Choosing
  `custom` shows two `Form.Control type="date"` inputs. Changes to presets apply at once;
  custom dates apply when both are valid.
- **User:** a searchable select backed by `GET /staff/users.json?search=<text>` as-is (it
  matches `username`, `display_name` and `email`, case-insensitively, paginated). Options
  show `name` (the username) with `email` as secondary text.
  - **Label for a `user` id loaded from the URL:** the search endpoint can't match by id, so
    the filter bar resolves it with the existing detail endpoint
    `GET /staff/users/<id>.json` and shows its `name`. On `404` it shows `#<id>` with a
    "deleted user" hint, and keeps the filter (it simply returns no data).
- **Domain:** a select fed by a new `GET /staff/statistics/domains.json` (see
  [API conventions](#api-conventions)), since no endpoint lists `Domain` rows today
  (`domains/urls.py` only exposes `domain/config.json`). Options: "Any", every domain
  (`domain` field, alphabetical), then "Unknown".
- **Audience:** All / Anonymous / Logged-in.
- **Granularity:** Auto / Day / Week / Month. The bar shows the resolved granularity next to
  "Auto" (from the response's `filters.granularity`).
- A **Reset** button clears every filter (navigates to the tab path with no query).

### URL query state

Filters live in the hash query of every statistics route, e.g.
`#/staff/statistics/visits?range=custom&from=2026-01-01&to=2026-03-31&audience=logged_in`.

| Param | Values | Default (omitted) | Notes |
|-------|--------|-------------------|-------|
| `range` | `7d`, `30d`, `90d`, `12m`, `custom` | `30d` | Presets are relative to "today" in the browser zone, so a shared preset link moves with time |
| `from` | `YYYY-MM-DD` | — | Only read when `range=custom` |
| `to` | `YYYY-MM-DD` | — | Only read when `range=custom` |
| `granularity` | `auto`, `day`, `week`, `month` | `auto` | Same values as the API |
| `user` | user id (integer) | any | Same value as the API |
| `domain` | domain id (integer) or `unknown` | any | `unknown` = sessions with `domain = NULL` |
| `audience` | `all`, `anonymous`, `logged_in` | `all` | Same values as the API |

- **Omitted when default:** a filter at its default (or "any") is not written to the URL, so
  the bare route is the default view and links stay short. "Any" has no encoding: it is the
  absence of the param.
- **Invalid URL values** (hand-edited links) fall back to the default on the client; the
  client never sends a value it can't parse, so API 400s only come from bugs.
- **Presets to dates** (client side, in the browser zone; `today` = the local date):
  `7d` → `from = today − 6 days`; `30d` → `today − 29`; `90d` → `today − 89`;
  `12m` → `from = (today − 1 year) + 1 day` (365 or 366 days, both within the
  [range cap](#granularity-and-range-cap)); `to = today` for every preset. `range=custom`
  without a valid `from` / `to` pair falls back to `30d`.
- **Allowlist:** append `range`, `from`, `to`, `granularity`, `user`, `domain`, `audience` to
  `FILTER_KEYS` in `HashRouteResolver.js` (and refresh the outdated `getFilterParams` JSDoc,
  which is already missing `category`, `completed` and `session`). `getFilterParams()` then
  exposes them. None of these names clashes with an existing filter key. Tab-specific params
  (`page` / `per_page`, and `sort` on the [Users](users.md#ordering) and
  [Visit list](visit-list.md#ordering) tabs) are **not** in
  `FILTER_KEYS` and not carried across tabs.
- **Writing the URL:** `statisticsHref(path, filters)` (in the statistics `helpers/`) builds
  `` `${path}?${query}` `` from the filter object, dropping defaults, and **without** the
  `page=1` that `buildFilteredHref` always adds (statistics tabs paginate only in the Visit
  list and Users ranking). Components set `window.location.hash = statisticsHref(...)`, as
  `StaffUsers.jsx` does with `buildFilteredHref`.
- **`tz` is not in the URL.** The client adds it to every API request from
  `Intl.DateTimeFormat().resolvedOptions().timeZone`, so a shared link renders in the
  viewer's zone.

### Granularity and range cap

Day counts are inclusive: `days = to − from + 1`.

- **Auto thresholds:**
  - `days ≤ 31` → `day` (at most 31 buckets);
  - `32 ≤ days ≤ 186` → `week` (ISO weeks, Monday start; at most 28 buckets);
  - `days ≥ 187` → `month` (at most 13 buckets with the cap below).

  So the `7d` and `30d` presets give days, `90d` gives weeks, and `12m` gives months.
- **Explicit override:** any of `day` / `week` / `month` is accepted for any valid range.
  The range cap bounds the worst case (`day` over the full cap = 366 buckets), which is still
  small enough to send and plot, so there is no separate "too many buckets" error.
- **Range cap: 366 days** (inclusive), from
  `statistics.settings.Settings.max_range_days()` (env
  `MAJORA_STATISTICS_MAX_RANGE_DAYS`, default `366`), following the existing
  `Settings` static-method pattern in `backend/statistics/settings.py`. Why 366:
  - the largest preset, `12m`, spans 365 or 366 days, so every preset fits and nothing
    larger is offered in the UI;
  - each request fetches at most one year of `Visit` rows through `values_list(...)` (a few
    columns per row, the `started_at` index bounding the scan). Traffic is modest, but the
    cost grows linearly with the range, and a year keeps it predictable;
  - it bounds the bucket count (366 daily, 53 weekly, 13 monthly);
  - it can be raised through the env var if multi-year views are ever needed, without a code
    change.

### API conventions

Every statistics endpoint is `GET staff/statistics/<name>.json` and follows
`backend/staff/views/staff_cache_summary.py`:

- decorators, outermost first: `@restricted` (sets `X-Skip-Cache: true`),
  `@api_view(['GET'])`, `@permission_classes([AllowAny])`, then an inline
  `require_staff(request)` (`games/views/common.py`) as the **first** statement: `401`
  anonymous, `403` non-staff, before any parameter is parsed (no validation oracle for
  non-staff);
- one view per file, `backend/staff/views/staff_statistics_<name>.py`, exported from
  `staff/views/__init__.py`, shared view helpers in `staff/views/_staff_statistics_shared.py`;
- registered in `backend/staff/urls.py` as
  `path('staff/statistics/<name>.json', views.staff_statistics_<name>,
  name='staff-statistics-<name>')` (kebab-case name);
- tests in `backend/staff/tests/staff_statistics_<name>_test.py`;
- never added to the Navi warm-up chain (restricted).

Tab specs choose `<name>` (e.g. `overview`, `visits`, `visit_list` → URL `visit-list.json`)
and their payload.

**Shared support endpoint** (part of the backend shared sub-issue, for the domain filter):

- `GET /staff/statistics/domains.json` — every `Domain` row as `[{"id": <int>, "domain":
  <str>}]`, ordered by `domain`, unpaginated (domains are a small, admin-managed set). Takes
  no filter params. Same decorator stack. Not to be confused with the Domains **tab**
  endpoint, `GET /staff/statistics/domains/summary.json` (see
  [Domains API](domains.md#api)).

#### Query params

| Param | Format | Default | Meaning |
|-------|--------|---------|---------|
| `from` | `YYYY-MM-DD` | `to − 29 days` | First local day, inclusive |
| `to` | `YYYY-MM-DD` | today in `tz` | Last local day, inclusive |
| `tz` | IANA zone name | `UTC` | Zone for day boundaries and buckets |
| `granularity` | `auto`, `day`, `week`, `month` | `auto` | Resolved per the thresholds above |
| `user` | positive integer | none | `Session.user_id` |
| `domain` | positive integer or `unknown` | none | `Session.domain_id`, or `domain IS NULL` |
| `audience` | `all`, `anonymous`, `logged_in` | `all` | `Session.user` null / not null |
| `page`, `per_page` | positive integers | `1`, `Settings.pagination_size()` | Paginated endpoints only; `per_page ≤ 100` |

- The range is the half-open UTC interval
  `[from 00:00 in tz, (to + 1 day) 00:00 in tz)`, matched against `Visit.started_at`. A
  visit belongs to the local day (and bucket) it **started** in.
- Filters combine with AND. `user` with `audience=anonymous` is valid and returns empty
  data.
- An **unknown `user` or `domain` id** (well-formed, no such row) is **not** an error: it
  returns zero-filled empty data. It costs no extra query, mirrors a deleted user still in a
  shared link, and staff can list users and domains anyway, so it hides nothing.
- Unknown query params are ignored.

#### Validation

All params are validated before any query, and **every** error is reported at once, with
the project's error shape (`{"errors": {"<field>": ["<code>"]}}`, as `validated_or_error`
and `staff_users_list`'s `invalid_status` return), status `400`:

| Field key | Code | When |
|-----------|------|------|
| `from` / `to` | `invalid_date` | Not a valid `YYYY-MM-DD` date, or outside `1970-01-01`..`9998-12-31` |
| `range` | `from_after_to` | `from > to` |
| `range` | `range_too_long` | `to − from + 1 > Settings.max_range_days()` |
| `tz` | `invalid_timezone` | Not in `zoneinfo.available_timezones()` |
| `granularity` | `invalid_granularity` | Not one of the enum values |
| `audience` | `invalid_audience` | Not one of the enum values |
| `user` | `invalid_user` | Not a positive integer ≤ `2**63 − 1` |
| `domain` | `invalid_domain` | Not a positive integer ≤ `2**63 − 1` nor `unknown` |
| `page` / `per_page` | `invalid_page` / `invalid_per_page` | Not a positive integer ≤ `2**63 − 1`, or `per_page > 100` |

The bounds keep every accepted value safe downstream: the date window lets the UTC range
(`to + 1 day`, `astimezone`) be computed in any zone without overflowing `datetime`, and
integers are matched against `^[0-9]{1,19}$` before conversion, then capped at the
`BigAutoField` maximum, so huge ids never reach the database and over-long digit strings never
reach `int()`.

`page` / `per_page` are validated strictly here (the shared `Paginator` silently falls back
to defaults and has no maximum), then passed to it unchanged. Range checks only run when
both dates parsed.

Tabs may add their own params, validated by their endpoint on top of the shared parser and
reported together with the shared errors: the `sort` of the [Users](users.md#ordering) and
[Visit list](visit-list.md#ordering) tabs, both rejected with the single shared
`invalid_sort` code.

#### Response envelope

Non-paginated (chart / KPI) endpoints return:

```json
{
  "filters": {
    "from": "2026-01-01",
    "to": "2026-03-31",
    "tz": "Europe/Lisbon",
    "granularity": "week",
    "requested_granularity": "auto",
    "user": null,
    "domain": "unknown",
    "audience": "all"
  },
  "buckets": [
    { "start": "2026-01-01", "end": "2026-01-04", "visits": 12 }
  ],
  "totals": { "visits": 12 }
}
```

- `filters` echoes the **resolved** values (defaults applied, `granularity` resolved), so the
  client shows what was actually computed.
- `buckets` (when the tab has a time series) is zero-filled, oldest first, one entry per
  bucket in the range. `start` / `end` are inclusive local dates, **clipped to the range**:
  the first ISO week or month may start after its calendar start, and the last may end
  early. Labels are formatted on the client with `Intl.DateTimeFormat`. Each tab defines the
  metric keys on a bucket and in `totals`.
- Other top-level keys (e.g. a histogram) are tab-specific.

**Paginated endpoints** (Visit list, Users ranking) follow
[`pagination.md`](../../pagination.md) instead: a plain JSON array with `page` / `pages` /
`per_page` / `total` headers, through `paginated_list_response`. No envelope: the client
already knows the filters it sent.

### Python aggregator

A new `backend/statistics/aggregation/` package (plain classes, one per file, like
`games/caches/`), so views stay thin: they parse, query, aggregate and serialize. Tests
mirror it in `backend/statistics/tests/aggregation/<module>_test.py`.

> **Naming trap:** the app itself is called `statistics`, which shadows Python's stdlib
> `statistics` module inside the backend. Never `import statistics` for `median` /
> `mean`; the helpers below implement them.

- **`filters.py` — `StatisticsFilters`:** a frozen dataclass with `from_date`, `to_date`,
  `tz` (`ZoneInfo`), `granularity` (resolved), `requested_granularity`, `user_id`
  (`int | None`), `domain` (`int | 'unknown' | None`), `audience`. Properties `start_utc` /
  `end_utc` give the half-open UTC interval (`datetime.combine(day, time.min, tzinfo=tz)`
  converted to UTC). `as_dict()` returns the envelope's `filters` echo.
- **`params_parser.py` — `StatisticsParamsParser(query_params, today=None)`:** the single
  place for every rule in [Validation](#validation). `parse()` returns
  `(filters, errors)`; `today` is injectable for tests (defaults to the local date in the
  parsed `tz`). The view helper `parse_statistics_filters(request)` in
  `staff/views/_staff_statistics_shared.py` wraps it and returns
  `(filters, error_response)`, matching the `(value, error_response)` tuple style of
  `staff_users_list.py`.
- **`granularity.py` — `Granularity`:** constants `DAY`, `WEEK`, `MONTH`, `AUTO`, the
  thresholds (`DAY_MAX_DAYS = 31`, `WEEK_MAX_DAYS = 186`) and `resolve(requested, from_date,
  to_date)`.
- **`bucket_calendar.py` — `BucketCalendar(filters)`:**
  - `buckets()` → the ordered, clipped `Bucket(start, end)` list covering the range;
  - `key_for(aware_dt)` → the bucket's `start` for a UTC timestamp: convert with
    `aware_dt.astimezone(filters.tz)`, take the local date, then the day itself, the ISO
    week's Monday, or the 1st of the month, and clip to `from_date`;
  - DST: buckets are local **calendar** days, so a DST day is a 23 h or 25 h bucket, and the
    per-timestamp `astimezone` conversion is always correct. In zones where local midnight
    doesn't exist on a transition day, `datetime.combine` with `fold=0` resolves it to the
    first valid instant, which is accepted.
- **`visit_query.py` — `VisitQuery(filters)`:**
  - `queryset()` → `Visit.objects.filter(started_at__gte=start_utc,
    started_at__lt=end_utc)` plus `session__user_id`, `session__domain_id` /
    `session__domain__isnull=True` (`unknown`) and `session__user__isnull` (audience), all
    through the ORM (no raw SQL);
  - `rows(*fields)` → `queryset().values_list(*fields)`, fetching only the columns a tab
    needs, e.g. `('started_at', 'last_seen_at', 'hits', 'session_id', 'session__user_id')`;
  - `visitor_key(user_id, session_id)` (static) → `('user', user_id)` when the session has a
    user, else `('session', session_id)`, per the [data model](data-model.md#visitor-key).
- **`series.py` — `Series(calendar)`:** `group(rows, timestamp_of)` buckets rows by
  `calendar.key_for(timestamp_of(row))`; `map(reducer)` applies a reducer per bucket and
  **zero-fills** every bucket of the range with `reducer([])`, returning
  `[{'start', 'end', **reducer_result}]` in order.
- **`metrics.py` — pure functions** (no DB, unit-tested on plain lists):
  - `count(values)`;
  - `unique(keys)` (distinct visitor keys);
  - `average(values)` → `None` on empty input;
  - `median(values)` → `None` on empty input, the mean of the two middle values for even
    lengths;
  - `histogram(values, edges)` → `[{'lower', 'upper', 'count'}]` for ascending `edges`
    (`[0, 60, 300]` gives `[0, 60)`, `[60, 300)`, `[300, ∞)` with `upper = None`); values
    below the first edge are counted in the first bin.

  Durations are `last_seen_at − started_at` in whole seconds.

### RequestStore

A `staffStatistics` resource in
`frontend/assets/js/utils/requests/config/staffStatisticsConfig.js`, registered in
`RESOURCES` (`resourceConfig.js`), following `staffUserConfig.js` / `staffPhotoConfig.js`:

- shape `{ GET: { <quantityType>: { regular: variant, private: variant } } }`, the **same**
  variant object for `regular` and `private`, `permission: null`;
- **no** entry in `RequestPermissionResolvers.js`: it falls back to `NO_PERMISSIONS`, as
  `staffUser` / `staffPhoto` do, and the route gate handles access;
- the shared sub-issue adds the `domains` quantity type
  (`path: () => '/staff/statistics/domains.json'`); each tab spec adds one quantity type per
  endpoint (e.g. `overview`, `visits`);
- **filters as query:** a `StatisticsQuery` helper reads the URL filters with
  `new HashRouteResolver().getFilterParams()`, resolves `range` into `from` / `to`, drops
  `range`, and adds `tz`. Controllers pass it as
  `RequestStore.ensure({ ..., query: StatisticsQuery.fromHash() })` (plus
  `getPaginationParams()` on paginated tabs), as `StaffUsersController.js` does. The
  query is part of the RequestStore cache key, so a filter change refetches.

### Recharts conventions

- **Dependency:** `recharts` (3.x) is added with
  `docker-compose run --rm majora_fe yarn add recharts`. React is 19.2, which Recharts 3
  supports.
- **Lazy loading:** there is no `React.lazy` in the app yet. The chunk boundary is the chart
  components only: `components/resources/staff_statistics/charts/index.js` re-exports every
  chart, and the tab pages load it with
  `const Charts = React.lazy(() => import('../charts/index.js'))` (one chunk for all
  statistics charts), rendered inside `<Suspense fallback={<LoadingMessage />}>`
  (`components/common/misc/LoadingMessage.jsx`). Pages, the shell, the filter bar and
  controllers stay in the main bundle (they are small, and non-staff users never mount
  them), so only Recharts and the chart helpers move to the lazy chunk.
- **Sizing:** charts use `<ResponsiveContainer width="100%" height={300}>` (fixed height,
  fluid width), wrapped in a `<div data-testid="statistics-<name>-chart">` owned by the
  component.
- **Tests:** Jasmine runs in plain Node and renders with `renderToStaticMarkup` (no DOM, no
  effects, no layout), so `ResponsiveContainer` never measures anything and no
  `ResizeObserver` is touched. Smoke tests import the chart component directly (not through
  the lazy chunk) and assert the `data-testid` wrapper renders for empty, single-point and
  normal data. If Recharts 3 still reads `ResizeObserver` at import or render time under
  Node, the Recharts setup sub-issue adds a no-op stub in
  `frontend/specs/support/resizeObserverStub.js`, registered as a Jasmine helper like
  `preloadTranslations.js`, only defining `globalThis.ResizeObserver` when it is missing.
- **Colors:** there are no app CSS custom properties yet (only SCSS variables in
  `assets/css/main.scss`). Add a `:root` block in `main.scss` declaring
  `--majora-chart-1` … `--majora-chart-6` (starting from `$secondary-color` and
  `$primary-color`), `--majora-chart-grid` and `--majora-chart-axis`, and use them as
  `stroke="var(--majora-chart-1)"` / `fill=...`. Tabs pick series colors from these.
- **Layout per chart**, matching `components/resources/staff_photo/pages/`:

  ```text
  components/resources/staff_statistics/
    pages/
      StaffStatistics<Tab>.jsx                 # route page, renders StaffStatisticsShell
      controllers/<Tab>Controller.js           # RequestStore read + API buckets -> points
      helpers/{StatisticsQuery.js, statisticsHref.js, ...}
      elements/{StaffStatisticsShell.jsx, StaffStatisticsTabs.jsx,
                StaffStatisticsFilterBar.jsx, ...}
      elements/controllers/StaffStatisticsFiltersController.js
    charts/
      index.js                                 # lazy chunk entry
      <Name>Chart.jsx                          # data-testid wrapper + ResponsiveContainer
      helpers/<Name>ChartHelper.jsx            # pure render(points, ...) -> Recharts tree
  ```

  Specs mirror it under `frontend/specs/assets/js/components/resources/staff_statistics/`.
  Page strings go in a new `staff_statistics_page` i18n namespace
  (`assets/i18n/{en,pt}/staff_statistics_page.yaml`).

### Access-control docs

- [`access-control/staff-statistics.md`](../../access-control/staff-statistics.md) is the
  authoritative per-endpoint page (shape of `staff-cache.md`), linked from
  [`access-control.md`](../../access-control.md) and from the model-level
  [`access-control/statistics.md`](../../access-control/statistics.md). It lists the shared
  `domains.json` endpoint now; each tab's implementation sub-issue appends its endpoint row.
- **`docs/agents/permissions.yaml` needs no change.** The `staff` role's `scope: staff` row
  ("staff-or-superuser only; dm does not qualify for this scope") already covers every
  `staff/*` endpoint, and like `staff-photo.md` these endpoints have no `EndpointPermission`
  entry (those are for game resources).

### Production topology check

**Result: not satisfied.** Checked against `docker-compose.yml`, `dockerfiles/production_*`,
`scripts/deploy.sh`, `scripts/render.sh`, `.circleci/config.yml`, `proxy/` and
`backend/statistics/middleware.py`:

- **The backend is directly reachable.** Django runs as a public Render web service
  (`scripts/render.sh`, gunicorn on `0.0.0.0:8080` in `backend/bin/server.sh`), with its own
  public host (`proxy/extension/lib/support/BackendClient.php`); Tent runs on a separate
  host and reaches it over the internet. Anyone can call it without going through Tent and
  send a forged `X-Forwarded-For`.
- **What sits in front of Tent can't be confirmed from the repo** (DNS / CDN for the Tent
  host, and the `.htaccess` copied at deploy time are not in the repo). Nothing restores a
  real client IP if an edge proxy is in front (no `CF-Connecting-IP` / `mod_remoteip`
  handling).
- **Header handling gaps:** `SetClientIpMiddleware` is only wired on the generic `.json`
  rule (`proxy/prod_configuration/rules/backend.php`), not on
  `private_game_data_cache.php`, `admin.php` or `redirects.php`, and
  `statistics/middleware.py` stores the raw `X-Forwarded-For` value (no split, no trusted
  hop count).

Consequence for the tabs: stored IPs are **best effort and spoofable**, not guaranteed
single client IPs. Tabs that display IPs (Visit list) show them as recorded, and the spec
pages must not present them as authoritative. The fix is tracked in the follow-up sub-issue
listed below; it does not block the statistics implementation.

## Open questions

- None. Tab-specific choices (metrics, payload keys, chart types, endpoint names) belong to
  the tab pages (#1483 to #1489).

## Implementation sub-issues

Created by #1482 under #1477:

| Issue | Layer | Implements |
|-------|-------|------------|
| #1498 | Backend | [Python aggregator](#python-aggregator), [API conventions](#api-conventions) (params, validation, envelope, `domains.json`), range-cap setting, [`staff-statistics.md`](../../access-control/staff-statistics.md) kept in sync |
| #1499 | Frontend shell | [Navigation and routes](#navigation-and-routes), [Filter bar controls](#filter-bar-controls), [URL query state](#url-query-state), [RequestStore](#requeststore), translations (needs #1498) |
| #1500 | Recharts setup | [Recharts conventions](#recharts-conventions): dependency, lazy chunk, sizing / test setup, CSS colors, a reference chart (builds on #1499) |
| #1501 | Follow-up (security) | [Production topology check](#production-topology-check) findings: client IP integrity; does not block the others |
