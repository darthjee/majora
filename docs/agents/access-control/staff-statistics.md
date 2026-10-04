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
> (#1498), for the Visits tab's `visits.json` (#1506) and for the Overview tab's
> `overview.json` (#1503). The other tab endpoints still land with their own implementation
> sub-issues of #1477; each appends its row below. Shared conventions:
> [`specs/access-statistics/shared-infrastructure.md`](../specs/access-statistics/shared-infrastructure.md#api-conventions).

| Action | Who can |
|--------|---------|
| List domains for the filter bar (`GET /staff/statistics/domains.json`) | **Staff-or-superuser** |
| Visits over time for the Visits tab (`GET /staff/statistics/visits.json`) | **Staff-or-superuser** |
| Overview KPIs for the Overview tab (`GET /staff/statistics/overview.json`) | **Staff-or-superuser** |

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
`invalid_domain`, `invalid_page` and `invalid_per_page` (`per_page > 100`); integer params
are capped at `2**63 − 1` (at most 19 digits) so they cannot overflow `int()` or the id
columns. Unknown params
are ignored. A well-formed but unknown `user` or `domain` id returns empty data, not an
error. Queries go through the ORM only, and filter payloads are not logged.

## Data exposed

**All staff see everything**: aggregated counts, user identities (id, username) and, where a
tab exposes them, raw stored IPs. There is no masking and no superuser-only tier, consistent
with staff already seeing user details in `/staff/users`. Stored IPs are **best effort**
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
