# Access Statistics

The staff-only **access statistics page** (`#/staff/statistics`, #1477) reports site traffic
recorded by the `statistics` app. It has seven tabs, each its own route, sharing one filter
bar. A **visits summary card** on the staff dashboard (#1678) shows the unique-visitors count
and offers a staff-only **Clear** that wipes all statistics. This page holds the lasting
knowledge about the feature: what is counted, how each metric is defined, the conventions
behind the `staff/statistics/*.json` API, the dashboard card, Clear and how tracking survives
a concurrent Clear.

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
  endpoints included, no bot filtering); the only exclusions are a valid
  `X-Statistics-Skip-Secret` header (`STATISTICS_SKIP_SECRET`; empty disables skipping) and the
  exact paths in `StatisticsSessionMiddleware.UNTRACKED_PATHS` (today only
  `/staff/statistics/export.json`, see [Export endpoint](#export-endpoint)).
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
  valid `X-Statistics-Skip-Secret` (e.g. Navi) and requests to the
  [export endpoint](#export-endpoint) create or update nothing.
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

Every read endpoint is `GET /staff/statistics/<name>.json`, restricted to staff (see
[Staff Statistics](access-control/staff-statistics.md) for access rules and validation
codes), never cached by Tent nor warmed by Navi. The one write is
[Clear](#clear) (`DELETE /staff/statistics.json`).

| Endpoint | Tab | Shape |
|----------|-----|-------|
| `domains.json` | Filter bar | `[{"id", "domain"}]`, no filters |
| `overview.json` | Overview | Envelope, `totals` only |
| `summary.json` | Dashboard card | Flat object, own `period` / `tz` params (see [Summary endpoint](#summary-endpoint)) |
| `visits.json` | Visits | Envelope with `buckets` |
| `visitors.json` | Visitors | Envelope with `buckets` |
| `duration.json` | Duration | Envelope with `buckets` and `histogram` |
| `domains/summary.json` | Domains | Envelope with `domains` instead of `buckets` |
| `users.json` | Users | Paginated array |
| `visit-list.json` | Visit list | Paginated array |
| `export.json` | none (investigation script) | Paginated array of raw sessions (see [Export endpoint](#export-endpoint)) |

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

## Export endpoint

`GET /staff/statistics/export.json` (#1699) returns the raw sessions **created** in the range
(`created_at`, then `id`), each with its visits **started** in the range (at most 100 per
session, `visits_truncated` when cut off), for the statistics investigation script. It reads
`from` / `to` / `tz` / `domain` / `page` / `per_page`. It is the only statistics route a scoped
API token (`statistics:read`, staff owner) can reach. Access, payload and validation:
[Staff Statistics](access-control/staff-statistics.md#export) and the
[export endpoint spec](specs/statistics-bug/export-endpoint.md).

- **No self-tracking.** `StatisticsSessionMiddleware.UNTRACKED_PATHS` holds
  `/staff/statistics/export.json`, matched against `request.path_info` **exactly** (no prefix,
  no trailing-slash variant). A request there gets `request.statistics_session = None`, opens or
  extends no visit and sets no cookie, like a valid skip header, so the export never pollutes
  the data it reads. Every other statistics route stays tracked.
- **Never stored by a cache:** `X-Skip-Cache: true` and `Cache-Control: private, no-store`
  (`CacheControlMiddleware` and `BearerNoCacheMiddleware` keep a view's own `no-store` value,
  `common/cache_control.py`).

## Staff dashboard card

The **visits summary card** (#1685) is the last entry (`visits_summary`) of
`frontend/assets/js/components/resources/staff_dashboard/pages/dashboardCardConfig.js` on
`/#/staff/dashboard`. The route is gated with `staffOrSuperuser`. The feature is permanent,
not a debug harness.

- It shows the unique-visitors count from [`summary.json`](#summary-endpoint) for a rolling
  period ending today, picked with a select: `day` (today, the default), `week` (the last 7
  days) or `month` (the last 30 days). Changing the period fetches again, and may be served
  from the `RequestStore` cache.
- **Reload** purges the whole `staffStatistics` RequestStore resource, then fetches again.
- **Clear** opens a confirmation modal. Its confirm button is enabled only when the input,
  trimmed, equals `CLEAR`. The word is case-sensitive and never translated; the text around it
  is. Cancelling, closing or confirming empties the input. Confirming calls
  [Clear](#clear) through `RequestStore.mutate` (`DELETE`, quantity type `clear`). On success
  the card shows the deleted visit and session counts. On failure it shows an error. In both
  cases it reloads the count, since a failed Clear may have deleted some rows.
- The period select, Reload and Clear are disabled while a fetch or a Clear is in flight.
- A link goes to the full statistics page (`#/staff/statistics`).
- `tz` is the browser zone (`Intl.DateTimeFormat().resolvedOptions().timeZone`). It is left
  out of the query when the browser cannot resolve it, so the server falls back to `UTC`.

Files, under `frontend/assets/js/components/resources/staff_dashboard/pages/elements/`:
`VisitsSummaryCard.jsx`, `controllers/VisitsSummaryCardController.js`,
`helpers/VisitsSummaryCardHelper.jsx` and the `ClearStatisticsConfirmModal` trio (component,
controller, helper). Both requests are in
`frontend/assets/js/utils/requests/config/staffStatisticsConfig.js` (`GET.summary`,
`DELETE.clear`), with `permission: null` and no entry in `RequestPermissionResolvers.js`, like
the other statistics endpoints.

## Summary endpoint

`GET /staff/statistics/summary.json` (`backend/staff/views/staff_statistics_summary.py`,
#1682) returns the unique visitors for the card. It does not reuse `overview.json`, which loads
every visit of the range into Python and runs the returning-visitors lookup. That is too heavy
for a card that loads with every dashboard visit.

- **Params** (`SummaryParamsParser`, `backend/statistics/aggregation/summary_params_parser.py`):
  only `period` (`day` | `week` | `month`, default `day`) and `tz` (shared `parse_tz`, default
  `UTC`). Other params are ignored. Validation codes and permissions:
  [Staff Statistics](access-control/staff-statistics.md#endpoints).
- **Window:** local days in `tz`, `to` = today and `from` = today minus 0, 6 or 29 days. It is
  matched against `Visit.started_at` like every other endpoint (see
  [Counting rules](#counting-rules-and-caveats)).
- **Count** (`UniqueVisitorsCount`, `backend/statistics/aggregation/unique_visitors_count.py`):
  one SQL aggregate over `VisitQuery`, distinct users plus distinct sessions without a user.
  This is the [visitor key](#visitor-key), so the count equals `overview.json`'s
  `totals.unique_visitors` for the same `from` / `to` / `tz`. It uses the existing
  `started_at` index and is not cached server-side.
- **Response:** the flat `{"period", "from", "to", "tz", "unique_visitors"}`.

## Clear

`DELETE /staff/statistics.json` (`backend/staff/views/staff_statistics_clear.py`, #1684)
deletes every `Visit` and `Session` row and resets both tables' IDs, so the next rows start at
id `1`. It returns `200 {"deleted_visits", "deleted_sessions"}` (zeros on an empty dataset)
only after the reset has finished. The counts include the Clear request's own visit and
session, which the middleware tracked before the view ran. Permissions, caching and token
rules: [Staff Statistics](access-control/staff-statistics.md#clear).

All the SQL lives in `StatisticsReset` (`backend/statistics/reset.py`). It is raw,
MySQL-only SQL (`DELETE … ORDER BY … LIMIT`, `AUTO_INCREMENT`), which is acceptable because the
test database is MySQL too.

1. **Visits pass:** `DELETE FROM statistics_visit ORDER BY id LIMIT <batch>` until a batch
   deletes nothing. Raw SQL skips Django's Python-side cascade collector, which would load
   every related visit.
2. **Sessions pass:** select up to `<batch>` session ids by id, delete their visits, then the
   sessions, until no ids are left. This catches a visit a live request added after the
   visits pass, so the session delete never fails on the foreign key.
3. **ID reset:** `ALTER TABLE … AUTO_INCREMENT = 1` on both tables. If tracking inserts a row
   before the `ALTER`, InnoDB keeps the highest id + 1 instead, which is harmless.

Rules:

- **No transaction.** Each batch commits on its own (autocommit), so locks last one batch and
  live tracking is not blocked. `ALTER TABLE` commits implicitly anyway, so the reset cannot run
  inside `atomic()`. `TRUNCATE` is not used: InnoDB refuses it on `statistics_session` because
  of the foreign key from `statistics_visit`.
- **Batch size:** `Settings.clear_batch_size()`, env `MAJORA_STATISTICS_CLEAR_BATCH_SIZE`,
  default `10000`.
- **Safety limit:** each pass stops after `MAX_BATCHES = 1000` batches by raising
  `StatisticsResetLimitExceeded`, which ends as a `500`.
- **No rollback on failure.** A database error or the safety limit returns `500`, and rows
  already deleted stay deleted. Running Clear again finishes the job.
- **Synchronous:** Clear runs inside the request. Production gunicorn has a 30 s timeout
  (`backend/bin/server.sh`); a Clear that runs longer is killed partway, and clicking Clear
  again finishes it.
- Concurrent clears need no lock: the deletes are idempotent, and each response counts only its
  own rows. Visit and session ids are reused after a clear, which is safe because no staff
  statistics endpoint is cached.

### Audit log

Clear wipes production data, so every run writes one line to the **server log only** (no
model, table or admin page). `log_statistics_clear` in the Clear view logs through
`logging.getLogger(__name__)`, the `staff` logger, which writes to stdout and is kept by
Render's log retention. It follows the other staff audit lines (`_api_token_shared.py`).

```text
staff_statistics_clear status=success staff_id=7 deleted_visits=1234 deleted_sessions=321 duration_ms=842
```

- `status` is `success` (logged at **INFO**) or `failed` (logged at **WARNING**, with an extra
  `error=<exception class name>`).
- `staff_id` is `request.user.id`. `duration_ms` is the time of the whole clear, so runs close
  to the gunicorn timeout are visible.
- **Partial counts:** on failure the line holds the rows deleted before the error. The counts
  are kept on the `StatisticsReset` instance (`deleted_visits` / `deleted_sessions`), which the
  view still holds when it logs. The exception is then re-raised.
- **Not logged:** the IP, the username, the email and the exception message (it may contain
  SQL). Leaving out the IP is deliberate: no backend log line records one, the IP is personal
  data that a Clear is meant to wipe, and `staff_id` plus Render's own request logs are enough
  to investigate.
- A run killed by the gunicorn timeout writes **no** line. The next Clear's line shows the rows
  that were left.

## Tracking race

A request that loaded its statistics session before or during a Clear may then write to a
session that no longer exists (#1683). The middleware (`backend/statistics/middleware.py`,
`visit_tracking.py`, `session_attachment.py`) tolerates this, so such a request is still
served normally and never returns a `500`. Its visit is just not recorded.

- **Touch:** `_touch_session` refreshes `last_seen_at` with a filtered `UPDATE`, which matches
  no rows for a deleted session.
- **Track:** opening a `Visit` runs inside a savepoint and catches only the foreign-key
  `IntegrityError`, so the enclosing transaction stays usable. Extending a visit is an `UPDATE`
  that matches no rows.
- **User attachment:** `attach_user`'s in-place `UPDATE` matches no rows and falls through to
  rotation, which creates a new user-tied `Session`.
- **Old cookies:** after a Clear every cookie points to a deleted `Session`.
  `_session_from_cookie` finds nothing, so the next request creates a new session.

The staff user who ran Clear usually counts as one visitor on the next Reload. This is
accepted: dashboard calls are tracked like any other request.

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
