# Visit list tab

> **Status:** specced · **Owner:** #1489 · **Route:** `/staff/statistics/visit-list` · Back to
> the [hub](../access-statistics.md)

## Purpose

Paginated raw list of visits: user, IP, domain, start, last seen, duration, hits, and whether
the visit is still ongoing.

## Decided

- Lists **visits**, not long-lived sessions (see [data model](data-model.md)): one row per
  `statistics.Visit` matched by the shared filters. A visit's IP, domain and user come from
  its `Session` (the session is reused only while the IP and domain match).
- Raw IPs are visible to all staff, with no masking, as recorded: best effort and spoofable
  until #1501 (see [access and security](access-and-security.md)).
- **Rows:** no zero-filling, no hard cap. Paginated per [`pagination.md`](../../pagination.md)
  (default `Settings.pagination_size()`, `per_page ≤ 100`).
- **Columns:** user, IP, domain ("unknown" for null domains), start, last seen, duration,
  hits, and an **ongoing** indicator computed server-side at request time (see
  [Metrics](#metrics)). Times are shown in the browser time zone.
- **Anonymous visits** (no user, including deleted users) show as "Anonymous" plus the short
  visitor id (the statistics `Session` id), so staff can tell repeat anonymous visitors apart.
  The session cookie token (`Session.token`) is **never** exposed.
- **Server-side ordering** through a tab-specific `sort` query param, as on the
  [Users tab](users.md#ordering): `started_at` (default), `last_seen`, `duration`, `hits`;
  always descending, ties broken by visit id descending. An invalid value is a `400` with the
  shared `invalid_sort` code (see [Ordering](#ordering)).
- **Links:** the row itself is **not** clickable. For a logged-in visit, the user cell links
  to the Overview tab with `?user=<id>`, keeping the other filters (`statisticsHref`), plus a
  separate small link to the user's staff page (`#/staff/users/<id>`), like the Users tab.
  Anonymous rows, IPs and domains are not links.
- **Response:** a plain JSON array of visit rows with the shared pagination headers
  (`page` / `pages` / `per_page` / `total`): no envelope, no totals (see [API](#api)).
- **No chart** in this iteration: the tab is a table only.
- Implementation is a **backend + frontend pair**, like the other tabs (see
  [Implementation sub-issues](#implementation-sub-issues)).

## Metrics

Rows are the visits matched by the shared filters: `Visit.started_at` inside the range (the
half-open UTC interval of [API conventions](shared-infrastructure.md#query-params)),
combined with the `user`, `domain` and `audience` filters on the visit's session
(`VisitQuery(filters).queryset()`). One row per visit; nothing is grouped or aggregated.

| Key | Definition | Sort key |
|-----|------------|----------|
| `id` | `Visit.id` (integer) | tie-break only |
| `started_at` | `Visit.started_at`, ISO 8601 UTC (`Z`) | `started_at` |
| `last_seen_at` | `Visit.last_seen_at`, ISO 8601 UTC (`Z`) | `last_seen` |
| `duration_seconds` | `last_seen_at − started_at` in whole seconds (truncated), `0` for a single-hit visit | `duration` |
| `hits` | `Visit.hits`: uncached backend requests, **not** page views (see [data model](data-model.md#visit-is-the-activity)) | `hits` |
| `ongoing` | `true` when `now − last_seen_at < Settings.visit_inactivity_seconds()`, i.e. the next request on the session would still extend this visit | not sortable |
| `ip` | `Session.ip`, the session's recorded IP as stored (string, always set) | not sortable |
| `domain` | `{ "id", "domain" }` of the session's domain; the "unknown" entry `{ "id": "unknown", "domain": null }` for sessions with `domain = NULL` (ids match the shared domain filter values) | not sortable |
| `session_id` | The statistics `Session.id` (integer): the visitor id, shown for anonymous rows | not sortable |
| `user` | The session user's identity, or `null` for anonymous visits (including deleted users) | not sortable |

`user`, when present, carries the same identity keys as the [Users tab](users.md#metrics)
(and `StaffUserListSerializer`), read from `User` and its `accounts.UserProfile`:

| Key | Value |
|-----|-------|
| `id` | `User.id` (integer) |
| `name` | `User.username` |
| `display_name` | `user.profile.display_name`, or `null` (unset, or no profile) |
| `email` | `User.email` |

- **`ongoing`** is computed by the server with a single clock (`timezone.now()` once per
  request), not by the browser, so it does not depend on the viewer's clock. It is a hint:
  an ongoing visit's `last_seen_at`, `duration_seconds` and `hits` keep growing.
- **`session_id`** is sent for every row (logged-in rows too), but the client only shows it
  for anonymous rows. It is the database id of the statistics session, not its cookie token;
  the token never leaves the server.

### Ordering

- `sort` query param, values `started_at` (default), `last_seen`, `duration`, `hits` (the
  sort keys in the [Metrics](#metrics) table).
- Always **descending** on the chosen key, ties broken by **visit id descending**, so the
  order is total and stable across pages and matches the newest-first default. This differs
  from the Users tab (user id ascending) on purpose: here the id follows creation order, so
  descending keeps "newest first" for equal keys.
- Validated together with the shared params: any other value is `400` with
  `{"errors": {"sort": ["invalid_sort"]}}`, reported **at once** with the shared errors
  (e.g. a bad `sort` and a bad `tz` give both keys). An empty `sort=` is invalid too; an
  omitted `sort` is the default. `invalid_sort` is the single shared code introduced by the
  Users tab; the validation should be one shared helper (e.g. in
  `staff/views/_staff_statistics_shared.py`, taking the tab's allowed keys and default)
  used by both endpoints, rather than a second copy.
- Sorting happens in the **database**: `started_at`, `last_seen` and `hits` are plain
  `order_by` fields, `duration` orders on an `F('last_seen_at') - F('started_at')`
  annotation. The `Paginator` then slices the queryset in SQL (unlike Users, which sorts
  computed metrics in Python).
- The response does not echo `sort` (no envelope); the client already knows what it sent.

## Filters

- **Apply:** date range, `user`, `domain` and `audience`, all with the shared semantics, on
  the visit's session.
- **Audience:** `anonymous` lists only visits whose session has no user (deleted users
  included); `logged_in` only visits with a user; `all` lists both.
- **User filter:** `user=<id>` lists that user's visits. An unknown or deleted user id gives
  an empty list (shared "unknown id is not an error" rule).
- **Granularity:** irrelevant (no time series). The endpoint accepts, validates and ignores
  it through the shared parser (so a URL carried from another tab never errors). The filter
  bar **hides** the granularity control (`showGranularity={false}`, as on Overview, Domains
  and Users); the `granularity` URL param is kept as-is so it carries over to other tabs.
- **Tab-specific params:** `sort`, `page`, `per_page`. Like on the Users tab, `sort` is
  **not** part of the shared filters: it is not added to `FILTER_KEYS`, not carried across
  tabs (`statisticsHref` drops it) and not sent by the other tabs.
- **Resets:** a filter change or a sort change navigates to page 1 (the new hash carries no
  `page`).

## Chart and layout

No chart. Rendered inside `StaffStatisticsShell`, below the filter bar and tab nav:

1. **Table** (Bootstrap `Table`, `hover`, `responsive`), one row per visit in API order:

   | Column | Value | Header sorts by |
   |--------|-------|-----------------|
   | User | logged in: `user.name` (link, see below), with `display_name` (when set) and `email` as small secondary text, plus a small profile link; anonymous: "Anonymous · #`session_id`" (plain text) | — |
   | IP | `ip` as recorded | — |
   | Domain | `domain.domain`, or the translated "unknown" label | — |
   | Start | `started_at`, `Intl.DateTimeFormat` (date and time, browser zone) | `started_at` |
   | Last seen | `last_seen_at`, same formatter, plus an "ongoing" badge when `ongoing` | `last_seen` |
   | Duration | `duration_seconds`, Overview's duration formatter | `duration` |
   | Hits | `hits`, `Intl.NumberFormat` (browser locale) | `hits` |

   - Durations use Overview's duration formatter (`Xm Ys`, `Xh Ym` from one hour), so a
     single-hit visit shows `0m 0s`.
   - **Sortable headers:** the sortable column headers are links that set `?sort=<key>`
     (dropping the param for the default `started_at`) and reset to page 1, through
     `statisticsHref(...)` plus the `sort` param. The active column shows a "descending"
     indicator (`aria-sort="descending"`). There is no ascending toggle (see
     [Open questions](#open-questions)).
   - **User link:** for a logged-in row, the user name is a link to
     `statisticsHref('/staff/statistics', { ...filters, user: user.id })`, opening Overview
     for that user with the other filters kept.
   - **Profile link:** a small link in the User cell to `#/staff/users/<id>` (the existing
     staff user page), as on the Users tab.
   - Rows are **not** clickable (no `role="link"` row); anonymous rows, IPs and domains are
     plain text.
2. **Pagination** under the table: the shared `Pagination` component
   (`components/common/pagination/Pagination.jsx`) with the `page` / `pages` / `per_page`
   headers, `basePath="#/staff/statistics/visit-list"` and `extraParams` holding the current
   statistics filters (defaults dropped, as in `statisticsHref`) plus `sort`, so page links
   keep both.

**Data points:** the controller maps the response to rows, in API order:
`{ id, startedAt, lastSeenAt, durationSeconds, hits, ongoing, ip, domain, sessionId, user }`,
where `domain` is a label (the hostname, or the translated unknown label) and `user` is
`{ id, name, displayName, email }` or `null`. It also exposes the pagination (`page`,
`pages`, `perPage`) and the active `sort`.

**States:**

- **Loading:** `LoadingMessage`.
- **Error:** the shared error message used by the other staff pages.
- **Empty** (empty list on page 1): a "No visits in this range" note and no table.
- **Page past the last one** (empty list with `page > 1`): the same note plus the
  pagination, so staff can go back.

**Layering**, following the shared [layout](shared-infrastructure.md#recharts-conventions)
(no chart component):

- `pages/StaffStatisticsVisitList.jsx` — route `staffStatisticsVisitList`, replaces the shell
  placeholder, renders the table and the pagination;
- `pages/controllers/VisitListController.js` — RequestStore read of the `visitList` quantity
  type, with `query: { ...StatisticsQuery.fromHash(), sort, ...getPaginationParams() }`,
  reading `{ data, pagination }`, maps the response to rows and pagination, unit-tested with
  fake setters;
- `pages/elements/StatisticsVisitListTable.jsx` — the table, the sortable headers, the user
  and profile links, the ongoing badge;
- sort helpers: generalize the Users tab's `pages/helpers/usersSort.js` into a shared helper
  taking the allowed keys and default (read and validate `sort` from the hash, invalid →
  default per the shared client rule; build a header href) if practical, otherwise add a
  `pages/helpers/visitListSort.js` with the same shape; unit-tested either way;
- reuses Overview's duration formatter and `statisticsHref`.

**i18n:** the `staff_statistics_page` namespace, `visit_list.*` keys (en + pt):
`visit_list.title`, `visit_list.user`, `visit_list.ip`, `visit_list.domain`,
`visit_list.started_at`, `visit_list.last_seen`, `visit_list.duration`, `visit_list.hits`,
`visit_list.anonymous`, `visit_list.unknown_domain`, `visit_list.ongoing`,
`visit_list.profile`, `visit_list.sorted_descending`, `visit_list.empty`.

## API

`GET /staff/statistics/visit-list.json`, following
[API conventions](shared-infrastructure.md#api-conventions) for a **paginated** endpoint:

- view `backend/staff/views/staff_statistics_visit_list.py` (`staff_statistics_visit_list`),
  URL name `staff-statistics-visit-list`, tests in
  `backend/staff/tests/staff_statistics_visit_list_test.py`;
- `@restricted` (`X-Skip-Cache: true`), `@api_view(['GET'])`, `AllowAny`, inline
  `require_staff` first (`401` / `403`);
- shared query params and validation (`parse_statistics_filters`), plus `page` / `per_page`
  (strict, shared rules) and the tab's `sort` (see [Ordering](#ordering)); all errors are
  returned at once;
- paginated with the shared `Paginator` (headers `page`, `pages`, `per_page`, `total`) over
  a DB-ordered queryset, so only the page's rows are loaded, through
  `paginated_list_response(request, queryset, serializer_cls, context=...)`
  (`games/views/common.py`), passing the request-time `now` in the serializer context for
  `ongoing`;
- not added to the Navi warm-up chain;
- a row is added to [`access-control/staff-statistics.md`](../../access-control/staff-statistics.md),
  noting that it exposes **raw IPs**, **statistics session ids** (new: other tabs only
  expose user ids) and user identities (id, username, display name, email) to staff; the
  session cookie token is never exposed;
- frontend: a `visitList` quantity type in `staffStatisticsConfig.js`
  (`path: () => '/staff/statistics/visit-list.json'`, same `regular` / `private` variant,
  `permission: null`), whose responses carry the pagination read by `fetchIndex`.

Response (`GET /staff/statistics/visit-list.json?from=2026-09-04&to=2026-10-03&tz=Europe/Lisbon&per_page=2`):

```text
page: 1
pages: 412
per_page: 2
total: 823
```

```json
[
  {
    "id": 90412, "started_at": "2026-10-03T09:41:02Z", "last_seen_at": "2026-10-03T09:58:47Z",
    "duration_seconds": 1065, "hits": 37, "ongoing": true,
    "ip": "203.0.113.24",
    "domain": { "id": 3, "domain": "majora.example.com" },
    "session_id": 5521,
    "user": { "id": 42, "name": "aria", "display_name": "Aria Stormwind", "email": "aria@example.com" }
  },
  {
    "id": 90398, "started_at": "2026-10-03T08:12:30Z", "last_seen_at": "2026-10-03T08:12:30Z",
    "duration_seconds": 0, "hits": 1, "ongoing": false,
    "ip": "198.51.100.7",
    "domain": { "id": "unknown", "domain": null },
    "session_id": 5517,
    "user": null
  }
]
```

| Key | Type |
|-----|------|
| `id`, `session_id` | positive integer |
| `started_at`, `last_seen_at` | ISO 8601 UTC timestamp string |
| `duration_seconds` | non-negative integer |
| `hits` | positive integer |
| `ongoing` | boolean |
| `ip` | string (IPv4 or IPv6) |
| `domain.id` | positive integer, or `"unknown"` |
| `domain.domain` | string, or `null` for the unknown entry |
| `user` | object, or `null` for anonymous visits |
| `user.id` | positive integer |
| `user.name`, `user.email` | string |
| `user.display_name` | string, or `null` when blank |

Queries (ORM only, no raw SQL):

1. `VisitQuery(filters).queryset()` with
   `select_related('session__user__profile', 'session__domain')`, annotated with the
   duration when `sort=duration`, ordered by the sort key descending then `-id`.
2. The `Paginator` counts and slices it in SQL; one query loads the page's rows with their
   session, domain, user and profile (no N+1).

`now` is read once per request and used for every row's `ongoing`. The view stays thin: it
parses the params, builds the ordered queryset (a small helper or class, e.g.
`statistics/aggregation/visit_list.py` — `VisitList(filters, sort)`, tested in
`statistics/tests/aggregation/`), paginates and serializes.

## Edge cases

- **Deleted users:** sessions with `user = NULL` count as anonymous (shared caveat), so a
  deleted user's visits show as "Anonymous · #`session_id`" and match `audience=anonymous`.
- **Visits that started before `from`** are not listed, even if they continue into the range.
- **Open visits** are listed with their current `last_seen_at`, duration and hits, and
  `ongoing: true`; a later reload may show larger values, and pages may shift while staff
  browse (no snapshot).
- **Single-hit visits** have `started_at = last_seen_at`, duration `0`.
- **Login is a visit boundary:** the request that logs a user in counts on the anonymous
  session's visit (see [data model](data-model.md#visit-is-the-activity)), so that visit
  stays anonymous; the next request opens a visit on the user's session.
- **Proxy-cached requests** never reach Django: anonymous browsing of cached public routes is
  undercounted, and `hits` counts backend requests, not page views.
- **No backfill:** visit data starts at the #1478 deploy; earlier ranges show the empty note.
- **Page past the last one:** the shared `Paginator` behavior applies (an empty list with the
  headers); the client shows the empty note with the pagination.
- **Staff traffic is counted:** staff browsing the statistics page appear in the list like
  anyone else (requests carrying `X-Statistics-Skip-Secret`, e.g. Navi, are not recorded).
- **IPs are best effort:** shown as recorded, spoofable off the Tent path until #1501.
- **User renamed:** rows show the current username / display name / email.
- **IP and domain per session:** a session's IP and domain are fixed (a new session starts
  when either changes), so every visit of a session shows the same IP and domain, and the
  same anonymous visitor id may appear on many rows.

## Open questions

- **Deferred:** filters on IP or on a single session (visitor id).
- **Deferred:** ascending sort (a toggle on the headers, e.g. `sort=-started_at`), as on the
  Users tab.
- **Deferred:** CSV export.
- **Deferred:** user agent / device columns (not stored by #1478).
- **Deferred:** a chart.

## Implementation sub-issues

Created by #1489 under #1477.

| Issue | Layer | Implements |
|-------|-------|------------|
| #1522 | Backend | [Metrics](#metrics), [Ordering](#ordering), [Filters](#filters) (row selection), [API](#api) (`visit-list.json`, shared `sort` helper, tests, access-control row); needs #1498 |
| #1523 | Frontend | [Filters](#filters), [Chart and layout](#chart-and-layout) (sortable table, pagination, user and profile links, ongoing badge, states), `visitList` quantity type, translations; needs #1499 and #1522 |
