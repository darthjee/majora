# Staff Statistics (access statistics page)

**[Staff resource](principles.md#resource-categories).** Staff-only endpoints behind the
access statistics page (`/staff/statistics`, #1477) and the staff dashboard. They aggregate
the `statistics` app's `Session` and `Visit` rows (model-level rules:
[Statistics](statistics.md)). The read endpoints are **GET-only**; the one write is
[Clear](#clear) (`DELETE /staff/statistics.json`). Every endpoint enforces
**Staff-or-superuser** inline (`require_staff`), matching every other `staff/*` endpoint, and
sets `X-Skip-Cache: true` per the [`X-Skip-Cache` rule](principles.md#x-skip-cache-rule)
(`@restricted`). None is warmed by Navi. There is no `EndpointPermission` /
`permissions.yaml` entry: the `staff` role's `scope: staff` row already covers them.

Shared filter, envelope and aggregation conventions:
[Access Statistics](../statistics.md#api-conventions).

| Action | Who can |
|--------|---------|
| List domains for the filter bar (`GET /staff/statistics/domains.json`) | **Staff-or-superuser** |
| Visits over time for the Visits tab (`GET /staff/statistics/visits.json`) | **Staff-or-superuser** |
| Overview KPIs for the Overview tab (`GET /staff/statistics/overview.json`) | **Staff-or-superuser** |
| Visitors summary for the staff dashboard card (`GET /staff/statistics/summary.json`) | **Staff-or-superuser** |
| New vs returning visitors for the Visitors tab (`GET /staff/statistics/visitors.json`) | **Staff-or-superuser** |
| Visit duration and hits per visit for the Duration tab (`GET /staff/statistics/duration.json`) | **Staff-or-superuser** |
| Logged-in users ranking for the Users tab (`GET /staff/statistics/users.json`) | **Staff-or-superuser** |
| Raw visit list for the Visit list tab (`GET /staff/statistics/visit-list.json`) | **Staff-or-superuser** |
| Per-domain comparison for the Domains tab (`GET /staff/statistics/domains/summary.json`) | **Staff-or-superuser** |
| Raw sessions and visits for the investigation script (`GET /staff/statistics/export.json`) | **Staff-or-superuser**, also through a scoped token with `statistics:read` (see [Export](#export)) |
| Clear all visit statistics and reset IDs (`DELETE /staff/statistics.json`) | **Staff-or-superuser** |

Anonymous callers get `401` and non-staff callers (including DMs and game admins without
staff) get `403`. Clear is the only write; no role can write through the other endpoints.

## Clear

`DELETE /staff/statistics.json` (#1684) deletes every `Session` and `Visit` row in batches
and resets both tables' IDs, then returns only the deleted row counts
(`{"deleted_visits", "deleted_sessions"}`); any other method is `405`. There is no stricter
rule than **Staff-or-superuser**, no environment gate and no rate limiting. It is
`@restricted` (`X-Skip-Cache: true`), proxied but not cached, and not warmed by Navi. Scoped
API tokens cannot reach it (`staff/` is excluded from token scopes; only the exact
[export](#export) route is carved out). Every run writes one
`staff_statistics_clear` line to the server log with the staff id, the counts, the duration
and the status (plus the exception class on failure); it never logs the IP, username, email
or exception message. See the
[audit log](../statistics.md#audit-log).

## Export

`GET /staff/statistics/export.json` (#1699) pages through the raw `Session` rows and their
visits for the statistics investigation script (Epic #1696). Contract and access matrix:
[export endpoint spec](../specs/statistics-bug/export-endpoint.md).

- **Access:** `require_staff` on every request. It is the only `staff/` route a scoped API token
  can reach: it declares `@token_scopes(GET=['statistics:read'])` and is carved out of the
  `staff/` exclusion by exact route (`SCOPED_STAFF_ROUTES`), so a token needs the scope **and**
  a still-staff owner (a demoted owner gets `403` `not_allowed`). See
  [Token scopes](token-scopes.md#statistics).
- **Params:** the shared parser (`from`, `to`, `tz`, `domain`, `page`, `per_page`; `user`,
  `audience` and `granularity` are validated but ignored), validated after `require_staff` and
  before any query. `per_page` defaults to `MAJORA_PAGINATION_SIZE`; above `100` it is `400`
  `invalid_per_page`, not clamped.
- **Rows:** the sessions **created** in `[from, to]` (local days in `tz`, default UTC), ordered
  by `created_at`, then `id` (fixed, not a param). Paginated: a plain JSON array with the
  `page` / `pages` / `per_page` / `total` headers. Each row is `{"id", "ip", "domain": {"id",
  "domain"}, "user_id", "created_at", "last_seen_at", "visits": [{"started_at",
  "last_seen_at", "hits"}], "visits_truncated"}`; a session without a domain gives
  `{"id": "unknown", "domain": null}`, an anonymous one `user_id: null`.
- **Visits:** only those whose `started_at` falls in the range, earliest first, at most
  **100 per session** (`visits_truncated: true` when cut off). They are read in one windowed
  query for the whole page (no N+1).
- **Never exposed:** the session `token`, and no user e-mail, name or profile data.
- **Caching and tracking:** `X-Skip-Cache: true` and `Cache-Control: private, no-store` on
  every response; not warmed by Navi; listed in
  [no-private-cache-routes](../no-private-cache-routes.md). `StatisticsSessionMiddleware` does
  not track it (see [Access Statistics](../statistics.md)).

## Frontend

Every tab route under `/staff/statistics` is gated with `[{ kind: 'staffOrSuperuser' }]` in
`frontend/assets/js/utils/access/accessRouteConfig.js`, and the "Access statistics" menu
entry is shown only to staff and superusers. Each page also wraps its body in
`StaffStatisticsAccessGate`, which renders nothing until `AccessStore.ensureStaffOrSuperUser()`
resolves and redirects anyone else to `#/`. The `staffStatistics` RequestStore resource has
no entry in `RequestPermissionResolvers.js`: there is no restricted/full split, and the route
gate handles access (the `staffUser` precedent).

## Check order

`require_staff` runs **before** any query parameter is parsed, so unauthenticated and
non-staff callers get `401` / `403` regardless of their parameters, and validation errors are
never returned to them.

## Input validation

Filter params (`from`, `to`, `tz`, `granularity`, `user`, `domain`, `audience`, `page`,
`per_page`) are validated strictly by one shared parser
(`statistics/aggregation/params_parser.py`, wrapped by `parse_statistics_filters` in
`staff/views/_staff_statistics_shared.py`); anything invalid is `400` with
`{"errors": {"<field>": ["<code>"]}}`, every error reported at once. Codes: `invalid_date`
(`from` / `to`, also outside `1970-01-01`..`9998-12-31`), `from_after_to` and `range_too_long` (`range`, checked only when both dates
parse; the cap is `MAJORA_STATISTICS_MAX_RANGE_DAYS`, default 366 inclusive days),
`invalid_timezone`, `invalid_granularity`, `invalid_audience`, `invalid_user`,
`invalid_domain`, `invalid_page` and `invalid_per_page` (`per_page > 100`), plus
`invalid_sort` for the tab-specific `sort` param of `users.json` and `visit-list.json` (merged into the same
`errors` object); integer params
are capped at `2**63 − 1` (at most 19 digits) so they cannot overflow `int()` or the id
columns. Unknown params
are ignored. `summary.json` reads only `period` and `tz` (see its endpoint entry). A well-formed but unknown `user` or `domain` id returns empty data, not an
error. Queries go through the ORM only, and filter payloads are not logged.

## Data exposed

**All staff see everything**: aggregated counts, user identities (id, username; the Users tab
also shows display name and email) and, where a tab exposes them, raw stored IPs. There is no
masking and no superuser-only tier, consistent with staff already seeing user details in `/staff/users`. Stored IPs are **best effort**
(see [client IP integrity](../statistics.md#client-ip-integrity)).

The Visit list tab (`visit-list.json`) exposes, per visit, the raw stored IP, the
**statistics session id** (new: the other tabs only expose user ids, never session ids) and
the user identity (id, username, display name, email). The session cookie token
(`Session.token`) is **never** exposed by any statistics endpoint.

## Endpoints

- **`GET /staff/statistics/domains.json`** — every `Domain` as `[{"id": <int>, "domain":
  <str>}]`, ordered by `domain`, unpaginated. Takes no filter params (any sent are ignored).
- **`GET /staff/statistics/visits.json`** — visits started in the range, per bucket. Takes the
  shared filter params (`from`, `to`, `tz`, `granularity`, `user`, `domain`, `audience`); not
  paginated. Returns the envelope `{"filters": {...}, "buckets": [{"start", "end",
  "anonymous", "logged_in", "visits"}], "totals": {"anonymous", "logged_in", "visits"}}`,
  every bucket of the range present (zero-filled) and `visits = anonymous + logged_in`. Only
  aggregated counts are exposed: no user identities and no IPs.
- **`GET /staff/statistics/overview.json`** — headline KPIs of the visits started in the
  range. Takes the shared filter params (`from`, `to`, `tz`, `user`, `domain`, `audience`;
  `granularity` is validated and echoed but ignored); not paginated. Returns
  `{"filters": {...}, "totals": {"visits", "unique_visitors", "logged_in_users",
  "average_duration_seconds", "new_visitors", "returning_visitors"}}` with no `buckets`;
  `average_duration_seconds` is `null` when there are no visits. Only aggregated counts are
  exposed: no user identities and no IPs.
- **`GET /staff/statistics/summary.json`** — unique visitors (a logged-in user, or an
  anonymous session) with visits started in a rolling window of local days ending today, for
  the staff dashboard card. Takes only `period` (`day` | `week` | `month`, default `day`;
  windows of 1, 7 and 30 days) and `tz` (default `UTC`); any other param is ignored, not
  validated. Invalid values are `400` with `invalid_period` / `invalid_timezone`, both
  reported at once (`tz` validation is shared with the other statistics endpoints). Returns
  the flat `{"period", "from", "to", "tz", "unique_visitors"}`, the count being one SQL
  aggregate equal to `overview.json`'s `totals.unique_visitors` for the same `from` / `to` /
  `tz`. Not cached server-side; sets `X-Skip-Cache: true` and is not warmed by Navi. Only an
  aggregated count is exposed: no user identities and no IPs.
- **`GET /staff/statistics/visitors.json`** — distinct visitors (a logged-in user, or an
  anonymous session) with visits started in the range, per bucket. Takes the shared filter
  params (`from`, `to`, `tz`, `granularity`, `user`, `domain`, `audience`); not paginated.
  Returns `{"filters": {...}, "buckets": [{"start", "end", "unique_visitors", "new_visitors",
  "returning_visitors", "anonymous", "logged_in"}], "totals": {"unique_visitors",
  "new_visitors", "returning_visitors", "anonymous", "logged_in"}}`, every bucket of the range
  present (zero-filled). Totals are distinct counts over the range, not bucket sums. The
  first-visit lookup that splits new from returning reads visits outside the range and the
  `domain` / `audience` filters, but only to compute counts. Only aggregated counts are
  exposed: no user identities and no IPs.
- **`GET /staff/statistics/duration.json`** — duration (`last_seen_at - started_at`, whole
  seconds) and hits of the visits started in the range, per bucket. Takes the shared filter
  params (`from`, `to`, `tz`, `granularity`, `user`, `domain`, `audience`); not paginated.
  Returns `{"filters": {...}, "buckets": [{"start", "end", "visits", "single_hit_visits",
  "average_duration_seconds", "median_duration_seconds", "average_hits", "median_hits"}],
  "totals": {same six keys}, "histogram": [{"lower", "upper", "count"}]}`, every bucket of the
  range present (zero-filled). Averages and medians are `null` without visits; totals are
  computed over all the visits of the range, not summed from buckets. The histogram has fixed
  edges in seconds (`0, 1, 30, 60, 180, 600, 1800, 3600`, last bin `upper: null`). Only
  aggregated values are exposed: no user identities and no IPs.
- **`GET /staff/statistics/users.json`** — logged-in users with visits started in the range,
  ranked by a visit metric. Takes the shared filter params (`from`, `to`, `tz`, `user`,
  `domain`, `audience`; `granularity` is validated but ignored) plus `sort` (`visits` by
  default, `time_on_site`, `average_duration`, `hits`, `last_seen`; always descending, ties
  broken by user id; anything else, including an empty `sort=`, is `invalid_sort`).
  Paginated: a plain JSON array (no envelope, no totals) with the `page` / `pages` /
  `per_page` / `total` headers (`per_page ≤ 100`). Each row is `{"id", "name",
  "display_name", "email", "visits", "time_on_site_seconds", "average_duration_seconds",
  "hits", "last_seen_at", "domains": [{"id", "domain"}]}`; `audience=anonymous` gives an
  empty list. Unlike the other statistics endpoints, it **exposes user identities** (id,
  username, display name, email) to staff, as `staff/users.json` already does. No IPs.
- **`GET /staff/statistics/visit-list.json`** — one row per visit started in the range
  (still-open visits included). Takes the shared filter params (`from`, `to`, `tz`, `user`,
  `domain`, `audience`; `granularity` is validated but ignored) plus `sort` (`started_at` by
  default, `last_seen`, `duration`, `hits`; always descending, ties broken by visit id
  descending; ordered and sliced in the database; anything else, including an empty `sort=`,
  is `invalid_sort`). Paginated: a plain JSON array (no envelope, no totals) with the
  `page` / `pages` / `per_page` / `total` headers (`per_page ≤ 100`). Each row is `{"id",
  "started_at", "last_seen_at", "duration_seconds", "hits", "ongoing", "ip", "domain": {"id",
  "domain"}, "session_id", "user": {"id", "name", "display_name", "email"} | null}`; a session
  without a domain gives `{"id": "unknown", "domain": null}` and anonymous (or deleted-user)
  visits give `user: null`. It **exposes raw IPs, statistics session ids and user
  identities** to staff, and never the session token. Not warmed by Navi; sets
  `X-Skip-Cache: true`.
- **`GET /staff/statistics/domains/summary.json`** — per-domain comparison of the visits
  started in the range. Takes the shared filter params (`from`, `to`, `tz`, `user`, `domain`,
  `audience`; `granularity` is validated and echoed but ignored); not paginated. Returns
  `{"filters": {...}, "domains": [{"id", "domain", "group", "visits", "anonymous",
  "logged_in", "unique_visitors", "average_duration_seconds", "median_duration_seconds"}],
  "totals": {same six metric keys}}` with no `buckets`. Without a `domain` filter every
  configured domain is present (zero-filled) plus the "unknown" row (`{"id": "unknown",
  "domain": null, "group": null}`, always last); `domain=<id>` keeps that row (a missing id
  gives `[]` and zero totals) and `domain=unknown` keeps only the unknown row. Durations are
  `null` on rows without visits; totals are computed over all the matched visits, not summed
  from rows. It exposes domain hostnames and group names (hostnames are already staff-visible
  through `domains.json`) and aggregated values only: no user identities and no IPs. Not
  warmed by Navi; sets `X-Skip-Cache: true`.
