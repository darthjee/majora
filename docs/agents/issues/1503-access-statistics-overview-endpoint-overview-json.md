# Issue: Access statistics: Overview endpoint (overview.json)

## Description
Backend endpoint for the access statistics **Overview** tab (#1477): `GET /staff/statistics/overview.json`, which returns the KPI `totals` the Overview tab shows (visits, unique visitors, logged-in users, average visit duration, new vs returning). The full definition is in `docs/agents/specs/access-statistics/overview.md` (specced in #1483), built on `docs/agents/specs/access-statistics/shared-infrastructure.md`. This issue implements the spec sections listed below; read them in the spec rather than relying on a copy here.

Dependency: #1498 (shared backend: `VisitQuery`, `metrics`, `parse_statistics_filters`, `statistics_envelope`) is merged, so this issue is unblocked. The spec's "implement Overview last" note is not a constraint here: the backend only uses the shared building blocks and does not depend on the other tabs' endpoints, so it can be built in any order. The frontend tab is #1504, which depends on this issue.

## Problem
The Overview tab needs one request that returns all of its KPI tiles for the selected filters. No endpoint returns these totals today, and the tab must not call the other tabs' endpoints.

## Expected Behavior
- `GET /staff/statistics/overview.json` follows the shared API conventions: `@restricted` (`X-Skip-Cache: true`), `@api_view(['GET'])`, `AllowAny`, and inline `require_staff` first (`401` anonymous, `403` non-staff). It validates the shared filters (`from`, `to`, `tz`, `granularity`, `user`, `domain`, `audience`) through `parse_statistics_filters`, returning `400` with the shared error codes. It takes no pagination params.
- `granularity` is accepted, validated and echoed in `filters`, but has no effect.
- The response is the standard envelope with `filters` and `totals` only (no `buckets`). `totals` contains `visits`, `unique_visitors`, `logged_in_users`, `new_visitors` and `returning_visitors` (non-negative integers), plus `average_duration_seconds` (rounded integer, or `null` when there are no visits).
- `new_visitors + returning_visitors == unique_visitors`. A visitor key counts as returning if it has any `Visit` before `start_utc` on **any** domain, ignoring the `domain` and `audience` filters ("first visit ever").
- The spec's edge cases all hold: empty or pre-deploy ranges, `user` filter (unknown/deleted ids give zeros), `audience=anonymous` / `logged_in`, `user` together with `audience=anonymous`, `domain` filter (including `domain=unknown`), anonymous visitors who later log in, deleted users counted as anonymous, open visits, and single-hit visits.

## Solution
- **Aggregation:** `backend/statistics/aggregation/overview_totals.py` with `OverviewTotals(filters)`. It makes one `VisitQuery(filters).rows('started_at', 'last_seen_at', 'session_id', 'session__user_id')` pass and computes visits, unique visitors, logged-in users and average duration in Python with the shared `metrics` helpers and `VisitQuery.visitor_key`. It then runs the earlier-visits lookup, which is skipped when there are no rows. That lookup has two ORM queries using `.values_list(...).distinct()`: one by `session__user_id__in` for users and one by `session_id__in` with `session__user__isnull=True` for anonymous sessions. Both are filtered by `started_at__lt=start_utc` and bounded by the in-range keys. Export `OverviewTotals` from `statistics/aggregation/__init__.py` (like `VisitsSeries`). Tests go in `backend/statistics/tests/aggregation/overview_totals_test.py`. No raw SQL.
- **View:** `backend/staff/views/staff_statistics_overview.py` (`staff_statistics_overview`), URL name `staff-statistics-overview`, kept thin, like `staff_statistics_visits`: `require_staff`, then `parse_statistics_filters`, then `statistics_envelope(filters, totals=OverviewTotals(filters).build())`. Tests go in `backend/staff/tests/staff_statistics_overview_test.py`.
- **Access control:** add the `overview.json` row and endpoint entry to `docs/agents/access-control/staff-statistics.md`.
- **Cache:** the endpoint is not added to the Navi warm-up chain.
- **Out of scope:** the Overview tab UI (#1504) and previous-period comparison (deferred in the spec).

### Acceptance criteria
- [ ] `overview.json` returns the spec's `totals` keys and types, with tests for: 401 anonymous, 403 non-staff, 200 staff, `X-Skip-Cache`, 400 on invalid params, and `granularity` echoed but ignored.
- [ ] `new_visitors + returning_visitors == unique_visitors`; earlier visits before the range (any domain, regardless of the `domain` filter) make a visitor returning.
- [ ] An empty range gives zero counts and `average_duration_seconds: null`; the earlier-visits lookup is skipped.
- [ ] The spec's edge cases (user / audience / domain combinations, unknown ids) are covered by tests.
- [ ] Not added to the Navi warm-up chain; `staff-statistics.md` updated.
- [ ] The `data-access`, `security` and `cache` reviews pass.

## Benefits
The Overview landing tab gets all its KPIs in one cheap, staff-only request (one bounded visit pass plus at most two indexed lookups), reusing the shared aggregation building blocks.
