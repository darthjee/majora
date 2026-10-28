# Issue: Statistics dashboard: unique-visitors count endpoint

## Description

Part of #1678 (Epic: staff dashboard visits summary card).

Add the backend endpoint that feeds the staff dashboard visits card (#1685):
`GET staff/statistics/summary.json?period=day|week|month&tz=<IANA zone>`. It returns the number
of **unique visitors** in a rolling window that ends today, in local dates of `tz`. Follow
`docs/agents/specs/statistics_dashboard/count-endpoint.md`, which is the source of truth for the
contract.

### Contract

**Query parameters**

| Param | Values | Default | Invalid value |
|---|---|---|---|
| `period` | `day` \| `week` \| `month` | `day` | `400 {"errors": {"period": ["invalid_period"]}}` |
| `tz` | an IANA zone name | `UTC` | `400 {"errors": {"tz": ["invalid_timezone"]}}` |

- Only `period` and `tz` are read. Any other query param (`from`, `granularity`, …) is
  ignored, not validated.
- When both params are invalid, both errors are returned in the same `errors` object.

**Responses**

- `200`:

  ```json
  {
    "period": "week",
    "from": "2026-10-21",
    "to": "2026-10-27",
    "tz": "America/Sao_Paulo",
    "unique_visitors": 42
  }
  ```

  `from` and `to` are the window's local dates in `tz`. `period` and `tz` echo the resolved
  values, defaults included.
- `400` for an invalid `period` and/or `tz`.
- `401` for anonymous callers.
- `403 {"errors": {"detail": ["not_allowed"]}}` for authenticated non-staff callers.

**Rolling windows**, in local dates of `tz`:

- `day`: `[today, today]`
- `week`: `[today − 6, today]`
- `month`: `[today − 29, today]`

## Problem

The staff dashboard card needs a cheap, fresh unique-visitors count. `overview.json`'s `totals.unique_visitors` is not reused: it loads every visit row of the range
into Python and runs the returning-visitors lookup, which is too heavy for a card that loads on
every dashboard visit.

## Expected Behavior

- Each period returns the correct count. The tests use visits inside and outside the window,
  including its first and last local days.
- Logged-in and anonymous visitors are both counted. One user with several sessions counts once,
  and a user id equal to an anonymous session id does not merge the two visitors.
- `tz` handling is tested, including a DST boundary.
- The defaults are tested (`period` → `day`, `tz` → `UTC`).
- The `400` cases are tested: invalid `period`, invalid `tz`, both combined, and other params
  being ignored.
- `401` for anonymous callers and `403 not_allowed` for non-staff callers are tested.
- A period with no visits returns `unique_visitors: 0`.
- A query-count test checks that the count is one aggregate query.
- An invariant test checks that, for the same `from` / `to` / `tz`, `unique_visitors` equals
  `overview.json`'s `totals.unique_visitors`.
- `docs/agents/access-control/staff-statistics.md` documents the endpoint.
- The change is reviewed by the cache, data-access and security agents.

## Solution

- **Params parsing:** a small dedicated parse step for `period` and `tz`. It does not use
  `parse_statistics_filters`, because that would validate every statistics param.
  - The tz validation is reused from `StatisticsParamsParser`: its tz parsing is exposed as a
    shared helper, so the `UTC` default and the `invalid_timezone` code stay identical.
  - `period` is a fixed choice, with the same `{"errors": {<field>: [<code>]}}` shape.
- **Window:**
  - "Today" is `timezone.now()` converted to `tz`, injectable for tests (the parser already
    accepts `today=`).
  - The UTC bounds use the same local-midnight conversion as `StatisticsFilters.start_utc` /
    `end_utc` (inclusive start, exclusive end the day after `to`). DST is therefore handled
    exactly as in `overview.json`.
- **Query:**
  - A `UniqueVisitorsCount` class in `backend/statistics/aggregation/`, next to
    `OverviewTotals`.
  - It runs one SQL aggregate over the `Visit` rows whose `started_at` is in the window:

    ```python
    Count('session__user_id', distinct=True)
    + Count('session_id', distinct=True, filter=Q(session__user_id__isnull=True))
    ```

  - This matches `VisitQuery.visitor_key` (logged-in visitors are keyed by user, anonymous ones
    by session). User ids and session ids stay in separate namespaces, so they cannot collide.
  - No rows are loaded into Python and there is no returning-visitors lookup.
  - The query uses the existing `Visit.started_at` index, and no new index is added.
- **View:** `backend/staff/views/staff_statistics_summary.py`.
  - It is shaped like `staff_statistics_overview.py`: `@restricted`, `@api_view(['GET'])`,
    `@permission_classes([AllowAny])`, with `require_staff` called inline.
  - It is routed in `backend/staff/urls.py` next to the other `staff/statistics/*.json` routes.
- **Caching:**
  - No server-side caching of the count, because Reload must return fresh data.
  - The endpoint is proxied through Tent but not cached (`X-Skip-Cache` via `@restricted`). It
    is not added to navi, and no new proxy handler is needed.
  - Scoped API tokens are already excluded from `staff/` routes, so no `@token_scopes` is needed.
- **Docs:** add the endpoint to `docs/agents/access-control/staff-statistics.md` (the
  permissions table and an endpoint entry), like `overview.json`.

### Out of scope

- The frontend card (#1685).
- The clear endpoint (#1684).
- Navi resources and any new DB index.
- Removing the spec files (#1686).
