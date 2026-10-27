# Write count-endpoint.md

Create `docs/agents/specs/statistics_dashboard/count-endpoint.md` using the common template.
Implemented by #1682.

- **Purpose:** a lightweight unique-visitors count for the dashboard card. Explain why
  `overview.json` is not reused: it loads every row into Python and runs the returning-visitors
  lookup.
- **Contract:** `GET staff/statistics/summary.json?period=<day|week|month>&tz=<IANA>`.
  - `period` defaults to `day`; anything else returns `400 {"errors": {"period": ["invalid_period"]}}`.
  - `tz` defaults to `UTC`; an invalid zone returns `400 {"errors": {"tz": ["invalid_timezone"]}}`,
    reusing `params_parser`. Errors for several fields are combined in the same object.
  - `200` returns the flat payload
    `{"period", "from", "to", "tz", "unique_visitors"}`. Include the issue's JSON example.
  - `401` for anonymous callers and `403 {"errors": {"detail": ["not_allowed"]}}` for non-staff.
  - The route goes in `backend/staff/urls.py` next to the other `staff/statistics/*.json` routes.
- **Behaviour:**
  - The rolling window is in `tz` local dates: day = `[today, today]`, week = `[today−6, today]`,
    month = `[today−29, today]`.
  - A single SQL aggregate, `COUNT(DISTINCT <visitor key>)` over `Visit` rows with `started_at`
    in the range, joined to `Session` for `user_id`. The visitor key matches
    `VisitQuery.visitor_key`.
  - It uses the existing `Visit.started_at` index, adds no new index, and is not cached.
- **Permissions & caching:**
  - `require_staff` inline under `@permission_classes([AllowAny])`, and `@restricted`
    (`X-Skip-Cache`).
  - Proxied through Tent but not cached, and not in navi.
  - No `@token_scopes` declaration is needed, because `staff/` is in `EXCLUDED_ROUTE_PREFIXES`.
  - Data exposure: an aggregate count only.
  - #1682 updates `docs/agents/access-control/staff-statistics.md` with this endpoint.
- **Edge cases:**
  - The tested invariant: the count equals `overview.json`'s `totals.unique_visitors` for the
    same `from` / `to` / `tz`, including DST boundaries.
  - A visit that spans midnight counts on its `started_at` day.
  - A period with no visits returns `0`.
  - Requests with the statistics-skip header are never counted.
- **Tests:**
  - Each period, with visits inside and outside the window.
  - Logged-in vs anonymous visitors, and one user with several sessions counted once.
  - `tz` and DST boundaries.
  - The defaults and the 400 cases, plus 401 and 403.
  - The query count (one aggregate).
  - The invariant against `overview.json`.
- **Open questions:** none (state "None").
- **Implemented by:** #1682.

## Files to Change

- `docs/agents/specs/statistics_dashboard/count-endpoint.md` — new topic page.
