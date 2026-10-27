# Count endpoint

Part of the [Statistics Dashboard](../statistics_dashboard.md) spec.

## Purpose

A lightweight endpoint that returns the number of **unique visitors** for a rolling period, for
the staff dashboard card ([dashboard-card.md](dashboard-card.md)).

`staff/statistics/overview.json` already returns `totals.unique_visitors`, but it is not reused:
it loads every visit row of the range into Python and runs the returning-visitors lookup, which is
too heavy for a card that loads with every dashboard visit.

## Contract

`GET staff/statistics/summary.json?period=<period>&tz=<IANA zone>`

The route goes in `backend/staff/urls.py`, next to the other `staff/statistics/*.json` routes.

**Query parameters**

| Param | Values | Default | Invalid value |
|---|---|---|---|
| `period` | `day` \| `week` \| `month` | `day` (when missing) | `400 {"errors": {"period": ["invalid_period"]}}` |
| `tz` | an IANA zone name (e.g. `America/Sao_Paulo`) | `UTC` | `400 {"errors": {"tz": ["invalid_timezone"]}}` |

- `tz` is parsed and validated by the existing statistics params parsing
  (`backend/statistics/aggregation/params_parser.py`), which already defaults to `UTC` and returns
  `invalid_timezone`.
- Errors for several fields are combined in the same `errors` object, as the other statistics
  endpoints do (`{"errors": {<field>: [<code>]}}`).

**Responses**

- `200`, a flat payload. `from` and `to` are the window's local dates in `tz`; `period` and `tz`
  echo the resolved values (defaults included):

  ```json
  {
    "period": "week",
    "from": "2026-10-21",
    "to": "2026-10-27",
    "tz": "America/Sao_Paulo",
    "unique_visitors": 42
  }
  ```

- `400` for an invalid `period` and/or `tz` (see above).
- `401` for anonymous callers.
- `403 {"errors": {"detail": ["not_allowed"]}}` for authenticated non-staff callers.

## Behaviour

- **Rolling window**, in local dates of `tz`, ending today:

  | `period` | Window |
  |---|---|
  | `day` | `[today, today]` |
  | `week` | `[today − 6, today]` |
  | `month` | `[today − 29, today]` |

  The window covers whole local days: from the start of `from` to the end of `to` in `tz`,
  converted to UTC for the query, so DST transitions are handled the same way `overview.json`
  handles them.
- **A single SQL aggregate:** `COUNT(DISTINCT <visitor key>)` over the `Visit` rows whose
  `started_at` is inside the window, joined to `Session` for `user_id`. No rows are loaded into
  Python and there is no returning-visitors lookup.
- **Visitor key:** the same as `VisitQuery.visitor_key`
  (`backend/statistics/aggregation/visit_query.py`): a logged-in visitor is keyed by user, an
  anonymous visitor by session.
- The query uses the existing `Visit.started_at` index (`backend/statistics/models.py`) and
  **adds no new index**. An index or a different strategy is considered only if the query later
  proves slow.
- **No server-side caching** of the count: Reload must return fresh data.

## Permissions & caching

- **Who:** staff or superuser only.
- **Server side:** the view calls `require_staff` inline under `@permission_classes([AllowAny])`
  (401 for anonymous, 403 `not_allowed` for non-staff), like
  `backend/staff/views/staff_statistics_overview.py`, and is decorated with `@restricted`, so the
  response carries `X-Skip-Cache`.
- **Tent / navi:** proxied through Tent but **not cached**; **not** added to the navi cache
  warmer. No new proxy handler is needed. The `cache` agent verifies this during review.
- **API tokens:** scoped API tokens cannot call `staff/` routes (`staff/` is in
  `EXCLUDED_ROUTE_PREFIXES` in `backend/accounts/authentication.py`), so no `@token_scopes`
  declaration is needed.
- **Authentication:** the standard token / cookie-token authentication.
- **Input validation:** only `period` (a fixed choice) and `tz` (validated against the IANA zone
  set by the existing parser) are accepted.
- **Data exposure:** an aggregate number plus the echoed params; no per-visitor or PII data. The
  `data-access` and `security` agents confirm this during review.
- **Docs:** #1682 updates `docs/agents/access-control/staff-statistics.md` with this endpoint.

## Edge cases

- **Consistency with `overview.json` (tested invariant):** for the same `from` / `to` / `tz`,
  `unique_visitors` equals `overview.json`'s `totals.unique_visitors`. Both use the same visitor
  key, the same rule that a visit counts when its `started_at` is inside the range, and the same
  `tz` local-day boundaries, including DST transitions.
- A visit that spans midnight counts on the day of its `started_at` only.
- `period` missing → `day`; `tz` missing → `UTC`; an invalid `period` or `tz` → `400` (both
  errors combined when both are invalid).
- A period with no visits returns `unique_visitors: 0`.
- Requests carrying the statistics-skip header are not tracked, so they never appear in the
  count.

## Tests

- Each period (`day`, `week`, `month`), with visits inside and outside the window, including the
  window's first and last days.
- Logged-in vs anonymous visitors; one user with several sessions is counted once.
- `tz` handling, including DST boundaries.
- The defaults (`period`, `tz`) and the `400` cases (each param, and both combined).
- `401` for anonymous and `403` for non-staff callers.
- The query count: one aggregate query.
- The invariant: the count equals `overview.json`'s `totals.unique_visitors` for the same
  `from` / `to` / `tz`.

## Open questions

None.

## Implemented by

#1682.
