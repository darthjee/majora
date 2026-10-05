# Staff Statistics (access statistics page)

**[Staff resource](principles.md#resource-categories).** Read-only, staff-only endpoints
behind the access statistics page (`/staff/statistics`, #1477). They aggregate the
`statistics` app's `Session` and `Visit` rows (model-level rules:
[Statistics](statistics.md)). Every endpoint is **GET-only**, enforces
**Staff-or-superuser** inline (`require_staff`), matching every other `staff/*` endpoint, and
sets `X-Skip-Cache: true` per the [`X-Skip-Cache` rule](principles.md#x-skip-cache-rule)
(`@restricted`). None is warmed by Navi. There is no `EndpointPermission` /
`permissions.yaml` entry: the `staff` role's `scope: staff` row already covers them.

> **Status:** live for the shared `domains.json` endpoint and the shared filter validation
> (#1498), for the Visits tab's `visits.json` (#1506), for the Overview tab's
> `overview.json` (#1503), for the Visitors tab's `visitors.json` (#1509) and for the
> Duration tab's `duration.json` (#1513) and for the Users tab's `users.json` (#1519). The other tab
> endpoints still land with their own implementation
> sub-issues of #1477; each appends its row below. Shared conventions:
> [`specs/access-statistics/shared-infrastructure.md`](../specs/access-statistics/shared-infrastructure.md#api-conventions).

| Action | Who can |
|--------|---------|
| List domains for the filter bar (`GET /staff/statistics/domains.json`) | **Staff-or-superuser** |
| Visits over time for the Visits tab (`GET /staff/statistics/visits.json`) | **Staff-or-superuser** |
| Overview KPIs for the Overview tab (`GET /staff/statistics/overview.json`) | **Staff-or-superuser** |
| New vs returning visitors for the Visitors tab (`GET /staff/statistics/visitors.json`) | **Staff-or-superuser** |
| Visit duration and hits per visit for the Duration tab (`GET /staff/statistics/duration.json`) | **Staff-or-superuser** |
| Logged-in users ranking for the Users tab (`GET /staff/statistics/users.json`) | **Staff-or-superuser** |

Anonymous callers get `401` and non-staff callers (including DMs and game admins without
staff) get `403`. No role can write through these endpoints.

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
`invalid_sort` for the tab-specific `sort` param of `users.json` only (merged into the same
`errors` object); integer params
are capped at `2**63 − 1` (at most 19 digits) so they cannot overflow `int()` or the id
columns. Unknown params
are ignored. A well-formed but unknown `user` or `domain` id returns empty data, not an
error. Queries go through the ORM only, and filter payloads are not logged.

## Data exposed

**All staff see everything**: aggregated counts, user identities (id, username; the Users tab
also shows display name and email) and, where a tab exposes them, raw stored IPs. There is no
masking and no superuser-only tier, consistent with staff already seeing user details in `/staff/users`. Stored IPs are **best effort**
until #1501 (client IP integrity) is resolved.

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
