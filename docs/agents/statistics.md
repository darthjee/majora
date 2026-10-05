# Access Statistics

The staff-only **access statistics page** (`#/staff/statistics`, #1477) reports site traffic
recorded by the `statistics` app. It has seven tabs, each its own route, sharing one filter
bar. This page holds the lasting knowledge about the feature: what is counted, how each
metric is defined, and the conventions behind the `staff/statistics/*.json` API.

Related docs:

- [Statistics (model access)](access-control/statistics.md): who can read and write
  `Session` / `Visit`.
- [Staff Statistics (endpoint access)](access-control/staff-statistics.md): the
  authoritative per-endpoint access rules, validation codes and payloads.
- [Frontend charts](frontend/charts.md): the generic Recharts conventions the tabs follow.

## Overview

The "Access statistics" entry of the staff menu (staff and superusers only) opens the
Overview tab. Every tab route is gated with `staffOrSuperuser`.

| Tab | Route | Endpoint | Shows |
|-----|-------|----------|-------|
| Overview | `/staff/statistics` | `overview.json` | KPI tiles (Bootstrap cards, no chart) |
| Visits | `/staff/statistics/visits` | `visits.json` | Stacked bars: anonymous vs logged-in visits per bucket |
| Visitors | `/staff/statistics/visitors` | `visitors.json` | Two stacked bar charts: new vs returning, anonymous vs logged-in |
| Duration | `/staff/statistics/duration` | `duration.json` | Duration and hits-per-visit line charts, duration histogram |
| Domains | `/staff/statistics/domains` | `domains/summary.json` | Horizontal stacked bars and a table, one row per domain |
| Users | `/staff/statistics/users` | `users.json` | Paginated ranking table of logged-in users |
| Visit list | `/staff/statistics/visit-list` | `visit-list.json` | Paginated table of raw visits |

The filter bar's domain select is fed by a shared support endpoint, `domains.json`.

## Data model

### `Session` is the visitor

`statistics.Session` (recorded by `StatisticsSessionMiddleware` in `backend/statistics`) is
long-lived: the signed `majora_statistics` cookie lasts 2 years
(`MAJORA_STATISTICS_COOKIE_MAX_AGE_SECONDS`), and the middleware reuses the session only while
the IP and domain match (an IP or domain change starts a new `Session`). Sessions are therefore the **visitor (device/browser) identity**, never
visits: counting sessions by `created_at` measures new sessions, and
`last_seen_at - created_at` measures cookie age.

`Session.last_seen_at` is **throttled**: it is only rewritten when at least 60 seconds stale
(`Settings.session_touch_interval_seconds()`, env
`MAJORA_STATISTICS_SESSION_TOUCH_INTERVAL_SECONDS`).

### `Visit` is the activity

`statistics.Visit` is a burst of activity under one session: `session` (FK,
`related_name='visits'`), `started_at`, `last_seen_at`, `hits`.

- Once the session is resolved, the middleware looks at the session's latest visit. If its
  `last_seen_at` is within the **inactivity window**, it is extended; otherwise a new visit
  opens with `hits = 1`.
- The inactivity window defaults to **30 minutes** (`Settings.visit_inactivity_seconds()`,
  env `MAJORA_STATISTICS_VISIT_INACTIVITY_SECONDS`).
- Extending a visit is one atomic `UPDATE` (`hits = hits + 1`, `last_seen_at = now`), so
  `hits` is exact under concurrency. Two requests arriving just after the window expires may
  both open a visit; this rare duplicate is accepted.
- `hits` counts **uncached backend requests, not page views**. Every request that reaches
  Django's middleware stack is tracked (any path, method or status, admin and the statistics
  endpoints included, no bot filtering); the only exclusion is a valid
  `X-Statistics-Skip-Secret` header (`STATISTICS_SKIP_SECRET`; empty disables skipping).
- **Login is a visit boundary.** When an anonymous session is rotated to a new user-tied
  `Session`, the login request counts on the anonymous visit, which ends; the next request
  opens a visit on the new session. When the user is attached in place (session created in
  the same request), the visit stays on that session. Visits are never moved between sessions.
- **No backfill:** visit data starts at the #1478 deploy.

Visit **duration** is `last_seen_at - started_at` in whole seconds; **hits per visit** is
`hits`. Durations measure the first to the last backend request, so they are a lower bound of
the real time on site (a single-request visit lasts `0` s).

### Visitor key

One person can own several `Session` rows (devices, browsers, IP changes). The **visitor
key** is `('user', user_id)` when the session has a user, otherwise `('session',
session_id)` (`VisitQuery.visitor_key`). It dedupes a logged-in user across devices,
browsers, domains and IP changes. It is computed at query time through the session join,
nothing is stored, so a session whose user was attached in place counts all its visits as
that user.

### Counting rules and caveats

- **A visit belongs to the local day (and bucket) it started in.** A visit that started
  before `from` is not counted, even if it continues into the range. Open visits count with
  their current `last_seen_at`, duration and hits.
- **Proxy-cached responses are invisible.** Requests served from the Tent cache never reach
  Django, so anonymous traffic on cached public routes is undercounted.
- **"Unique visitors" is an estimate.** An anonymous visitor whose IP changes, or a visitor
  who logs in or out, counts as more than one visitor.
- **Null domains** (unrecognized host) are shown as an **"unknown"** domain, never dropped.
  Deleting a `Domain` sets its sessions' domain to `NULL`, moving their history to "unknown".
- **Deleted users** leave sessions with `user = NULL`, counted as anonymous.
- **Staff traffic is counted**, including the statistics page itself. Requests carrying a
  valid `X-Statistics-Skip-Secret` (e.g. Navi) create or update nothing.
- **Times are stored in UTC**; ranges and buckets use the browser's time zone.

## Metrics

All metrics cover the visits whose `started_at` falls in the range, combined (AND) with the
`user`, `domain` and `audience` filters on the visit's session. "New vs returning" always
uses the **first visit ever**: a visitor key is *returning* if it has any `Visit` before the
reference instant, looked up on every domain and audience (the range, `domain` and
`audience` filters are ignored for that lookup).

Averages and medians are `null` without visits. Durations are rounded to the nearest
integer, `average_hits` to one decimal, and an even-count median is the mean of the two
middle values. **Totals are always computed over all matched visits**, never from bucket or
row values.

### Overview

`totals` only, no buckets:

| Key | Definition |
|-----|------------|
| `visits` | Matched visits |
| `unique_visitors` | Distinct visitor keys |
| `logged_in_users` | Distinct non-null user ids |
| `average_duration_seconds` | Average visit duration |
| `new_visitors` | Keys with no `Visit` before the range start |
| `returning_visitors` | Keys with a `Visit` before the range start |

`new_visitors + returning_visitors == unique_visitors`. Near the #1478 deploy almost every
visitor shows as new, since earlier activity was never recorded ("new" means "first visit
recorded").

### Visits

Per bucket and in `totals`: `anonymous` (session without user), `logged_in` and
`visits = anonymous + logged_in`. Visits only: no hits, durations or unique visitors.

### Visitors

Per bucket: the distinct visitor keys among the bucket's visits, as `unique_visitors`, split
into `new_visitors` / `returning_visitors` (relative to the **bucket's** start) and
`anonymous` / `logged_in` (by key kind). Both splits add up to `unique_visitors`.

`totals` are **range-level distinct counts**, with new vs returning relative to the
**range** start, so they match Overview. They are not sums of buckets: a visitor seen in
several buckets counts once in each, but once in `totals`. With a domain filter, the
buckets' `new_visitors` may add up to less than `totals.new_visitors`.

### Duration

Per bucket and in `totals`: `visits`, `single_hit_visits` (`hits == 1`),
`average_duration_seconds`, `median_duration_seconds`, `average_hits`, `median_hits`.
Single-hit visits (duration `0`) are included in averages and medians, so
`totals.average_duration_seconds` equals Overview's.

The top-level `histogram` covers the whole range with fixed edges
`[0, 1, 30, 60, 180, 600, 1800, 3600]` seconds: eight half-open bins
(`lower <= duration < upper`), the last with `upper: null`, counts summing to
`totals.visits`. The `0 s` bin can hold slightly more than `single_hit_visits`, since a
multi-hit visit can also last under one second.

### Domains

One row per configured `Domain` (with its `DomainGroup` name), zero-filled, plus the
**"unknown"** row (`id: "unknown"`), always **last**. Each row has `visits`, `anonymous`,
`logged_in`, `unique_visitors`, `average_duration_seconds` and `median_duration_seconds`.

- Rows are ordered by `visits` descending, then hostname ascending, with "unknown" last.
  The tab's table can re-sort columns on the client; the unknown row always stays last.
- `domain=<id>` keeps that row only (an unknown id gives no rows and zero totals);
  `domain=unknown` keeps only the unknown row.
- Visit counts in the rows add up to `totals`, but `unique_visitors` does not: a visitor seen
  on several domains counts once per row and once in `totals`.

### Users

One row per logged-in user with at least one matched visit (no zero-filling), grouping the
user's visits from every device and domain: `visits`, `time_on_site_seconds` (sum of
durations), `average_duration_seconds`, `hits`, `last_seen_at` (latest among matched visits)
and `domains` (distinct domains, by hostname, "unknown" last). Rows carry the user identity
(`id`, `name` = username, `display_name`, `email`).

- **Ordering:** `sort` = `visits` (default), `time_on_site`, `average_duration`, `hits` or
  `last_seen`; always descending, ties broken by user id ascending. Sorting runs in Python
  over every matching user, then the page is sliced.
- `audience=anonymous` gives an empty list; deleted users never appear. A user deleted
  between the ranking and the identity lookup is dropped from the page while the `total`
  header still counts it.

### Visit list

One row per matched visit: `id`, `started_at`, `last_seen_at`, `duration_seconds`, `hits`,
`ongoing`, `ip`, `domain`, `session_id` and `user` (`null` for anonymous and deleted-user
visits). The session cookie token is never exposed.

- `ongoing` is computed server-side with one clock per request: `true` while
  `now - last_seen_at` is below the inactivity window.
- **Ordering:** `sort` = `started_at` (default), `last_seen`, `duration` or `hits`; always
  descending, ties broken by visit id descending. Ordering and slicing run in the database.
- A session's IP and domain are fixed, so every visit of a session shows the same IP and
  domain, and the anonymous visitor id (`session_id`) repeats across rows.

## Filters and URL state

One filter bar (`StaffStatisticsFilterBar`) is shared by every tab. Its state lives in the
hash route's query, so switching tabs keeps the filters and links can be shared.

| Param | Values | Default (omitted) |
|-------|--------|-------------------|
| `range` | `7d`, `30d`, `90d`, `12m`, `custom` | `30d` |
| `from`, `to` | `YYYY-MM-DD`, read only with `range=custom` | — |
| `granularity` | `auto`, `day`, `week`, `month` | `auto` |
| `user` | user id | any |
| `domain` | domain id or `unknown` | any |
| `audience` | `all`, `anonymous`, `logged_in` | `all` |

- Defaults are omitted from the URL. Invalid URL values (bad presets, dates, ids, or a
  `custom` range without a valid `from <= to` pair) fall back to the default on the client.
  The range cap is enforced by the backend only: a too-long custom range shows the tab's
  load error.
- Presets resolve on the client, in the browser zone, ending today: `7d` and `30d` / `90d`
  cover the last 7, 30 and 90 days, `12m` the last year (365 or 366 days).
- `tz` is not in the URL: the client adds the browser zone to every API request.
- `page`, `per_page` and `sort` are tab-specific: they are not carried across tabs, and a
  filter or sort change returns to page 1.
- Tabs without a time series (Overview, Domains, Users, Visit list) hide the granularity
  control but keep the URL param, so it carries over.

**Granularity** (`days = to - from + 1`): `auto` resolves to `day` for 31 days or less,
`week` (ISO weeks, Monday start) up to 186 days, and `month` beyond. An explicit `day` /
`week` / `month` is accepted for any valid range. **Range cap:** 366 inclusive days
(`Settings.max_range_days()`, env `MAJORA_STATISTICS_MAX_RANGE_DAYS`), so every preset fits.

## API conventions

Every endpoint is `GET /staff/statistics/<name>.json`, restricted to staff (see
[Staff Statistics](access-control/staff-statistics.md) for access rules and validation
codes), never cached by Tent nor warmed by Navi.

| Endpoint | Tab | Shape |
|----------|-----|-------|
| `domains.json` | Filter bar | `[{"id", "domain"}]`, no filters |
| `overview.json` | Overview | Envelope, `totals` only |
| `visits.json` | Visits | Envelope with `buckets` |
| `visitors.json` | Visitors | Envelope with `buckets` |
| `duration.json` | Duration | Envelope with `buckets` and `histogram` |
| `domains/summary.json` | Domains | Envelope with `domains` instead of `buckets` |
| `users.json` | Users | Paginated array |
| `visit-list.json` | Visit list | Paginated array |

**Query params:** `from` / `to` (inclusive local days, default the last 30 days ending today
in `tz`), `tz` (IANA zone, default `UTC`), `granularity`, `user`, `domain`, `audience`, plus
`page` / `per_page` (default `MAJORA_PAGINATION_SIZE`, `per_page <= 100`; validated on
every endpoint) and `sort` on paginated endpoints. The range is the
half-open UTC interval `[from 00:00, (to + 1 day) 00:00)` in `tz`, matched against
`Visit.started_at`. All params are validated before any query and every error is reported
at once (`400`). A well-formed but unknown `user` or `domain` id returns empty data, not an
error. Unknown params are ignored.

**Envelope** (non-paginated endpoints): `filters` echoes the resolved values (defaults
applied, `granularity` resolved, `requested_granularity` as sent); `buckets` is zero-filled,
oldest first, with inclusive local `start` / `end` dates **clipped to the range** (the first
and last week or month may be partial); `totals` holds the range-level metrics. Paginated
endpoints return a plain array with the `page` / `pages` / `per_page` / `total` headers of
[pagination.md](pagination.md), with no envelope.

**Aggregation** happens on the fly, with no precomputed rollups and no server-side caching.
The `backend/statistics/aggregation/` package keeps views thin:

- `StatisticsParamsParser` / `StatisticsFilters` parse and validate the params;
- `VisitQuery` builds the ORM queryset (no raw SQL) and fetches only the needed columns;
- `BucketCalendar` and `Series` bucket timestamps **in Python** with `zoneinfo` in the
  requested zone (local calendar days, so DST days are 23 h or 25 h) and zero-fill empty
  buckets;
- `metrics` holds pure `count` / `unique` / `average` / `median` / `histogram` helpers.

Bucketing stays in Python because MySQL's `CONVERT_TZ` needs time zone tables that the
official image does not load, and MySQL has no `MEDIAN`. Revisit only if it measures slow.

> **Naming trap:** the app is called `statistics`, which shadows Python's stdlib module
> inside the backend. Never `import statistics` for `median` / `mean`; use the `metrics`
> helpers.

**Frontend:** the `staffStatistics` RequestStore resource has one quantity type per endpoint,
with identical `regular` / `private` variants, `permission: null` and no entry in
`RequestPermissionResolvers.js` (the route gate handles access). `StatisticsQuery` turns the
URL filters into the API query (resolving `range` into `from` / `to` and adding `tz`).

## Client IP integrity

Django is a public Render web service that any client can call directly, so client IPs are
trusted only through a shared secret (#1501):

- Tent sends `X-Proxy-Secret` (and its own `X-Forwarded-For`) on the standard proxy rules,
  stripping any client-supplied copy. Django (`backend/common/client_ip.py`) trusts the
  leftmost valid `X-Forwarded-For` entry only when the header matches `PROXY_SECRET`
  (constant-time compare); otherwise it falls back to `REMOTE_ADDR`. Requests are never
  rejected, and an empty `PROXY_SECRET` disables the gate.
- Rules served through custom `BackendClient` handlers (`cache.php`, `delete.php`,
  `uploads.php`) drop both headers, so Django records Tent's IP for them.
- **Caveat:** if an edge proxy or CDN sits in front of Tent, every request is recorded with
  the edge's IP. This has not been verified in production.

`PROXY_SECRET` must hold the same value on the Render backend service and in Tent's
server-side `locals.php` (local dev: `.env`). Stored IPs are therefore **best effort**: not
client-chosen, but possibly less precise than the real client IP. `X-Forwarded-Host` is not
covered by the secret gate (see [game access](access-control/game.md)).
