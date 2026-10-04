# Users tab

> **Status:** specced · **Owner:** #1488 · **Route:** `/staff/statistics/users` · Back to the
> [hub](../access-statistics.md)

## Purpose

Logged-in users ranked by visits and time on site, with last seen. Clicking a user applies
the user filter on the other tabs.

## Decided

- Lists logged-in users only; all staff see user identities (see
  [access and security](access-and-security.md)).
- Clicking a user sets `?user=<id>` in the URL query, applying the user filter on the other
  tabs (see [shared infrastructure](shared-infrastructure.md)).
- **Rows:** one row per logged-in user (`session__user_id` not null) with at least one
  matched visit. Users with no visits in the range are not listed (no zero-filling).
- **No hard cap:** "top N" is the current page. The list is paginated per
  [`pagination.md`](../../pagination.md) (default `Settings.pagination_size()`,
  `per_page ≤ 100`).
- **Metrics / columns:** user (name, with the email as secondary text), visits, total time
  on site, average visit duration, hits, domains and last seen (see [Metrics](#metrics)).
- **Server-side ordering** through a tab-specific `sort` query param, always descending,
  ties broken by user id, default `visits`. Every numeric column plus last seen is sortable.
  An invalid value is a `400` with a new `invalid_sort` code (see [Ordering](#ordering)).
- **Row click** opens the Overview tab with `?user=<id>`, keeping the other filters
  (`statisticsHref`), like the Domains row click. A separate small link in the row opens the
  user's staff page (`#/staff/users/<id>`).
- **Response:** a plain JSON array of user rows with the shared pagination headers
  (`page` / `pages` / `per_page` / `total`): no envelope, no totals (see [API](#api)).
- **No chart** in this iteration: the tab is a table only (a chart is deferred, see
  [Open questions](#open-questions)).
- Implementation is a **backend + frontend pair**, like the other tabs (see
  [Implementation sub-issues](#implementation-sub-issues)).

## Metrics

All metrics cover the visits matched by the shared filters: `Visit.started_at` inside the
range (the half-open UTC interval of
[API conventions](shared-infrastructure.md#query-params)), combined with the `user`,
`domain` and `audience` filters on the visit's session, **and** restricted to logged-in
sessions (`session__user_id` not null). Visits are grouped by `session__user_id`, so a user's
visits from every device, browser and domain land on one row (the
[visitor key](data-model.md#visitor-key) of a logged-in user).

Per visit: **duration** = `last_seen_at − started_at` in whole seconds.

| Key | Definition | Sort key |
|-----|------------|----------|
| `visits` | `metrics.count` of the user's matched visits (always `≥ 1`) | `visits` |
| `time_on_site_seconds` | Sum of the user's visit durations (integer) | `time_on_site` |
| `average_duration_seconds` | `metrics.average` of the durations, rounded to the nearest integer (as on Duration) | `average_duration` |
| `hits` | Sum of `Visit.hits`: uncached backend requests, **not** page views (see [data model](data-model.md#visit-is-the-activity)) | `hits` |
| `domains` | The domains the user's matched visits belong to (by session), see below | not sortable |
| `last_seen_at` | Latest `Visit.last_seen_at` among the matched visits, ISO 8601 UTC (`Z`) | `last_seen` |

Each row also carries the user's identity, read from `User` (stock
`django.contrib.auth` user) and its `accounts.UserProfile`, with the same keys as
`StaffUserListSerializer` (`GET /staff/users.json`):

| Key | Value |
|-----|-------|
| `id` | `User.id` (integer) |
| `name` | `User.username` (same `name` as the staff users endpoint and the filter bar) |
| `display_name` | `user.profile.display_name`, or `null` (unset, or no profile) |
| `email` | `User.email` |

- **`domains`** is a list of `{ "id", "domain" }` objects, one per distinct
  `session__domain_id` among the user's matched visits, ordered by hostname, with the
  "unknown" entry (`{ "id": "unknown", "domain": null }`, sessions with `domain = NULL`)
  last. The ids match the shared domain filter values.
- `average_duration_seconds` is never `null` here (every row has at least one visit), but
  the client still renders `null` as `—`, sharing Overview's formatter.
- Since every row has at least one visit, a single-hit visit (duration `0`) gives
  `time_on_site_seconds = 0` and `average_duration_seconds = 0`, which are valid values.

### Ordering

- `sort` query param, values `visits` (default), `time_on_site`, `average_duration`, `hits`,
  `last_seen` (the sort keys in the [Metrics](#metrics) table).
- Always **descending** on the chosen key, ties broken by **user id ascending**, so the
  order is total and stable across pages.
- Validated together with the shared params: any other value is `400` with
  `{"errors": {"sort": ["invalid_sort"]}}`, reported **at once** with the shared errors
  (e.g. a bad `sort` and a bad `tz` give both keys). An empty `sort=` is invalid too; an
  omitted `sort` is the default.
- The response does not echo `sort` (no envelope); the client already knows what it sent.

## Filters

- **Apply:** date range, `user`, `domain` and `audience`, all with the shared semantics.
  `domain` restricts the matched visits, so the `domains` list of a row then holds only the
  selected domain (or "unknown").
- **Granularity:** irrelevant (no time series). The endpoint accepts, validates and ignores
  it through the shared parser (so a URL carried from another tab never errors). The filter
  bar **hides** the granularity control (`showGranularity={false}`, as on Overview and
  Domains); the `granularity` URL param is kept as-is so it carries over to other tabs.
- **Audience:** `all` and `logged_in` give the same rows (the tab only lists logged-in
  users). `audience=anonymous` gives an **empty list** (`total: 0`), not an error.
- **User filter:** `user=<id>` gives at most that one row (none when the user has no visits
  in the range). An unknown or deleted user id gives an empty list (shared "unknown id is not
  an error" rule).
- **Tab-specific params:** `sort`, `page`, `per_page`. Like `page` / `per_page`, `sort` is
  **not** part of the shared filters: it is not added to `FILTER_KEYS`, not carried across
  tabs (`statisticsHref` drops it) and not sent by the other tabs.
- **Resets:** a filter change or a sort change navigates to page 1 (the new hash carries no
  `page`).

## Chart and layout

No chart. Rendered inside `StaffStatisticsShell`, below the filter bar and tab nav:

1. **Table** (Bootstrap `Table`, `hover`, `responsive`), one row per user in API order:

   | Column | Value | Header sorts by |
   |--------|-------|-----------------|
   | User | `name`, with `display_name` (when set) and `email` as small secondary text, plus a small profile link (see below) | — |
   | Visits | `visits` | `visits` |
   | Time on site | `time_on_site_seconds`, duration formatter | `time_on_site` |
   | Avg duration | `average_duration_seconds`, duration formatter | `average_duration` |
   | Hits | `hits` | `hits` |
   | Domains | the hostnames, comma-separated, "unknown" for the unknown entry | — |
   | Last seen | `last_seen_at`, `Intl.DateTimeFormat` (date and time, browser zone) | `last_seen` |

   - Numbers use `Intl.NumberFormat` in the browser locale; durations use Overview's
     duration formatter (`Xm Ys`, `Xh Ym` from one hour, `—` when `null`), so a long time on
     site shows as e.g. `52h 10m`.
   - **Sortable headers:** the sortable column headers are links that set `?sort=<key>`
     (dropping the param for the default `visits`) and reset to page 1, through
     `statisticsHref(...)` plus the `sort` param. The active column shows a "descending"
     indicator (`aria-sort="descending"`). There is no ascending toggle (see
     [Open questions](#open-questions)).
   - **Row click:** sets `window.location.hash =
     statisticsHref('/staff/statistics', { ...filters, user: row.id })`, opening Overview
     for that user with the other filters kept. Rows are links (`role="link"`, keyboard
     accessible).
   - **Profile link:** a small link in the User cell to `#/staff/users/<id>` (the existing
     staff user page). Its click stops propagation, so it does not also trigger the row
     click.
2. **Pagination** under the table: the shared `Pagination` component
   (`components/common/pagination/Pagination.jsx`) with the `page` / `pages` / `per_page`
   headers, `basePath="#/staff/statistics/users"` and `extraParams` holding the current
   statistics filters (defaults dropped, as in `statisticsHref`) plus `sort`, so page links
   keep both (as `StaffUsersHelper.jsx` does with its filters).

**Data points:** the controller maps the response to rows, in API order:
`{ id, name, displayName, email, visits, timeOnSiteSeconds, averageDurationSeconds, hits,
domains, lastSeenAt }`, where `domains` is a list of labels (the hostname, or the translated
unknown label). It also exposes the pagination (`page`, `pages`, `perPage`) and the active
`sort`.

**States:**

- **Loading:** `LoadingMessage`.
- **Error:** the shared error message used by the other staff pages.
- **Empty** (empty list on page 1): a "No logged-in users in this range" note and no table.
- **Page past the last one** (empty list with `page > 1`): the same note plus the
  pagination, so staff can go back.

**Layering**, following the shared [layout](shared-infrastructure.md#recharts-conventions)
(no chart component):

- `pages/StaffStatisticsUsers.jsx` — route `staffStatisticsUsers`, replaces the shell
  placeholder, renders the table and the pagination;
- `pages/controllers/UsersController.js` — RequestStore read of the `usersRanking` quantity
  type, with `query: { ...StatisticsQuery.fromHash(), sort, ...getPaginationParams() }`
  (as `StaffUsersController.js` does), reading `{ data, pagination }`, maps the response
  to rows and pagination, unit-tested with fake setters;
- `pages/elements/StatisticsUsersTable.jsx` — the table, the sortable headers, row
  navigation and the profile link;
- `pages/helpers/usersSort.js` — pure helpers: read and validate `sort` from the hash
  (invalid → default, per the shared client rule) and build a header href, unit-tested;
- reuses Overview's duration formatter and `statisticsHref`.

**i18n:** the `staff_statistics_page` namespace, `users.*` keys (en + pt): `users.title`,
`users.user`, `users.visits`, `users.time_on_site`, `users.average_duration`, `users.hits`,
`users.domains`, `users.last_seen`, `users.unknown_domain`, `users.profile`,
`users.sorted_descending`, `users.empty`.

## API

`GET /staff/statistics/users.json`, following
[API conventions](shared-infrastructure.md#api-conventions) for a **paginated** endpoint:

- view `backend/staff/views/staff_statistics_users.py` (`staff_statistics_users`), URL name
  `staff-statistics-users`, tests in `backend/staff/tests/staff_statistics_users_test.py`;
- `@restricted` (`X-Skip-Cache: true`), `@api_view(['GET'])`, `AllowAny`, inline
  `require_staff` first (`401` / `403`);
- shared query params and validation (`parse_statistics_filters`), plus `page` / `per_page`
  (strict, shared rules) and the tab's `sort` (see [Ordering](#ordering)); all errors are
  returned at once;
- paginated with the shared `Paginator` (`games/paginator.py`, headers `page`, `pages`,
  `per_page`, `total`), called by the view itself rather than through
  `paginated_list_response`, because identities are merged into the page after slicing
  (see the query plan below);
- not added to the Navi warm-up chain;
- a row is added to [`access-control/staff-statistics.md`](../../access-control/staff-statistics.md),
  noting that it exposes user identities (id, username, display name, email), as
  `staff/users.json` already does for staff;
- frontend: a `usersRanking` quantity type in `staffStatisticsConfig.js`
  (`path: () => '/staff/statistics/users.json'`, same `regular` / `private` variant,
  `permission: null`), whose responses carry the pagination read by `fetchIndex`.

Response (`GET /staff/statistics/users.json?from=2026-09-04&to=2026-10-03&tz=Europe/Lisbon&per_page=2`):

```text
page: 1
pages: 20
per_page: 2
total: 39
```

```json
[
  {
    "id": 42, "name": "aria", "display_name": "Aria Stormwind", "email": "aria@example.com",
    "visits": 18, "time_on_site_seconds": 15420, "average_duration_seconds": 857,
    "hits": 1302,
    "domains": [
      { "id": 5, "domain": "brand.example.org" },
      { "id": 3, "domain": "majora.example.com" }
    ],
    "last_seen_at": "2026-10-02T21:14:09Z"
  },
  {
    "id": 7, "name": "borin", "display_name": null, "email": "borin@example.com",
    "visits": 12, "time_on_site_seconds": 6010, "average_duration_seconds": 334,
    "hits": 488,
    "domains": [
      { "id": 3, "domain": "majora.example.com" },
      { "id": "unknown", "domain": null }
    ],
    "last_seen_at": "2026-09-30T08:02:51Z"
  }
]
```

(Default `sort=visits`: had both users 18 visits, the tie would put `#7` before `#42`.)

| Key | Type |
|-----|------|
| `id` | positive integer |
| `name`, `email` | string |
| `display_name` | string, or `null` when blank |
| `visits` | positive integer |
| `time_on_site_seconds`, `average_duration_seconds`, `hits` | non-negative integer |
| `domains[].id` | positive integer, or `"unknown"` |
| `domains[].domain` | string, or `null` for the unknown entry |
| `last_seen_at` | ISO 8601 UTC timestamp string |

Queries (ORM only, no raw SQL):

1. **One `VisitQuery` pass:** `VisitQuery(filters).queryset()` narrowed to
   `session__user__isnull=False`, then `values_list('session__user_id',
   'session__domain_id', 'session__domain__domain', 'started_at', 'last_seen_at', 'hits')`.
   Rows are grouped by user in Python; a reducer returns the metric keys from
   `metrics.count` / `average`, sums, a max and the distinct domains. With
   `audience=anonymous` the queryset is empty and nothing else is queried.
2. **Sort and slice:** every matching user's row is built, sorted per
   [Ordering](#ordering), then sliced by the `Paginator`. The `Paginator` calls a no-arg
   `count()` and slices, so `UsersRanking` returns a small sequence wrapper over the sorted
   list exposing `count()` and `__getitem__` (a plain `list` won't do: `list.count` needs an
   argument), letting the shared class be reused unchanged. Sorting on computed metrics needs
   all users before slicing; this is bounded by the [range cap](shared-infrastructure.md#granularity-and-range-cap)
   (at most one year of visits) and modest traffic, and the number of users is far smaller
   than the number of visits.
3. **One `User` query** for the page's ids
   (`User.objects.select_related('profile').filter(id__in=...)`), merged into the page
   rows, which are then returned as `Response(rows, headers=headers)`. Deleted users never appear (their sessions have
   `user = NULL`), so every page id resolves.

This lives in a small aggregation class (`statistics/aggregation/users_ranking.py` —
`UsersRanking(filters, sort)` returning the sorted metric rows, without identities), so the
view stays thin and the logic is tested in `statistics/tests/aggregation/`. The view
paginates that list, then adds the identities for the page. `sort` is validated by the view
(through a small helper in `staff/views/_staff_statistics_shared.py` or a `SORT_KEYS`
constant on `UsersRanking`), merging its error into the shared parser's errors.

## Edge cases

- **Deleted users:** sessions with `user = NULL` count as anonymous (shared caveat), so a
  deleted user is never listed; their past visits simply drop out of this tab.
- **Users on several domains or devices:** one row per user; `domains` lists each domain
  once. With the `domain` filter only that domain's visits count.
- **Open visits** count with their current duration and `last_seen_at`; a single-hit visit
  has duration `0` and is included in the totals and the average.
- **Visits that started before `from`** are not counted, even if they continue into the
  range, so `last_seen_at` comes from visits that started in the range only.
- **Login is a visit boundary:** the request that logs a user in counts on the anonymous
  session's visit (see [data model](data-model.md#visit-is-the-activity)), so it never adds
  to that user's row; the next request opens the user's visit.
- **Proxy-cached requests** never reach Django. Logged-in traffic is mostly uncached, but
  `hits` still counts backend requests, not page views.
- **No backfill:** visit data starts at the #1478 deploy; earlier ranges show the empty
  note.
- **Page past the last one:** the shared `Paginator` behavior applies (an empty list with
  the headers); the client shows the empty note with the pagination.
- **Staff traffic is counted:** staff browsing the statistics page are logged-in users and
  appear in the ranking like anyone else (requests carrying `X-Statistics-Skip-Secret`, e.g.
  Navi, are not recorded at all).
- **User renamed:** rows show the current username / display name / email; history is not
  split.

## Open questions

- **Deferred:** a chart (e.g. a horizontal bar chart of the top users by the sorted
  metric).
- **Deferred:** comparison with the previous period, as on Overview.
- **Deferred:** CSV export.
- **Deferred:** ascending sort (a toggle on the headers, e.g. `sort=-visits`).

## Implementation sub-issues

Created by #1488 under #1477.

| Issue | Layer | Implements |
|-------|-------|------------|
| #1519 | Backend | [Metrics](#metrics), [Ordering](#ordering), [Filters](#filters) (row selection), [API](#api) (`users.json`, `UsersRanking`, tests, access-control row); needs #1498 |
| #1520 | Frontend | [Filters](#filters), [Chart and layout](#chart-and-layout) (sortable table, pagination, row click, profile link, states), `usersRanking` quantity type, translations; needs #1499 and #1519 |
