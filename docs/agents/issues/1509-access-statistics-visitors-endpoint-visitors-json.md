# Issue: Access statistics: Visitors endpoint (visitors.json)

## Description
Backend endpoint of the access statistics **Visitors** tab (#1477). Spec: `docs/agents/specs/access-statistics/visitors.md` (specced in #1485), built on `docs/agents/specs/access-statistics/shared-infrastructure.md`. This issue implements the spec's **Metrics** and **API** sections; read them there instead of a copy here.

### Dependencies

Needs #1498 (shared backend: aggregator, params parser, envelope), already merged. Follows the patterns of Overview (#1503) and Visits (#1506).

### Out of scope

The Visitors tab UI (#1510), previous-period comparison and retention (deferred). No changes to the Overview `OverviewTotals` / `ReturningVisitors` classes.

## Solution
- **API:** `GET /staff/statistics/visitors.json`: view `backend/staff/views/staff_statistics_visitors.py` (`staff_statistics_visitors`), URL name `staff-statistics-visitors`, tests in `backend/staff/tests/staff_statistics_visitors_test.py`. It uses the shared decorator stack (`@restricted`, `@api_view(['GET'])`, `AllowAny`, inline `require_staff` first), the shared params and validation via `parse_statistics_filters`, and the standard envelope with `filters`, `buckets` and `totals`. Mirror `staff_statistics_visits.py`.
- **First-visit lookup:** a new class in `backend/statistics/aggregation/first_visits.py` (`FirstVisits`). Given the in-range user ids and anonymous session ids, it returns `first_visit[key]` (`Min('started_at')` per key). It ignores the range and the `domain` / `audience` filters, makes no query for an empty id set, and is tested in `statistics/tests/aggregation/`. It sits next to the Overview `ReturningVisitors` class, which stays untouched: `ReturningVisitors` only answers "any visit before `start_utc`?", and the per-bucket split needs the first-visit timestamp itself.
- **Aggregation:** `backend/statistics/aggregation/visitors_series.py` (`VisitorsSeries(filters).build()` returns `(buckets, totals)`). It makes one `VisitQuery` pass over `('started_at', 'session_id', 'session__user_id')`, with keys from `VisitQuery.visitor_key`, then one `FirstVisits` lookup (skipped when there are no rows). Per key, `first_bucket` is `None` when `first_visit < start_utc`, otherwise `BucketCalendar.key_for(first_visit)`. Rows are grouped with `Series(...).group(...).map(reducer)` (zero-filled with `reducer([])`). Per bucket, the reducer computes `unique_visitors`, `new_visitors` (keys whose `first_bucket` is this bucket's start), `returning_visitors`, `anonymous` and `logged_in` as distinct keys. `totals` are range-level distinct counts, with new = keys whose `first_bucket` is not `None`.
- **Edge cases** (tests): audience / user / domain filter combinations (the domain filter does not affect the first-visit lookup), empty ranges, unknown ids, deleted users (anonymous session keys), an anonymous visitor who later logs in (two keys), clipped first / last buckets, DST days, and an open visit started before `from`.
- **Access control:** add the `visitors.json` row to `docs/agents/access-control/staff-statistics.md`. Not added to the Navi warm-up chain.

### Acceptance criteria

- [ ] `visitors.json` returns the spec's envelope, bucket keys and types, with tests: 401 anonymous, 403 non-staff, 200 staff, `X-Skip-Cache`, 400 on invalid params.
- [ ] Buckets are zero-filled, oldest first, clipped to the range; every key is always present (zeros for the filtered-out audience).
- [ ] `new_visitors + returning_visitors == unique_visitors` and `anonymous + logged_in == unique_visitors` on every bucket and in `totals`.
- [ ] A test cross-checks that, on the same fixtures and filters, the `VisitorsSeries` totals `unique_visitors`, `new_visitors`, `returning_visitors` and `logged_in` equal the `OverviewTotals` keys `unique_visitors`, `new_visitors`, `returning_visitors` and `logged_in_users`.
- [ ] `FirstVisits` is a new class; `ReturningVisitors` and `OverviewTotals` are unchanged.
- [ ] Not added to the Navi warm-up chain; `staff-statistics.md` updated.
- [ ] `data-access`, `security` and `cache` reviews pass.
