# Add VisitorsSeries aggregator
Create `backend/statistics/aggregation/visitors_series.py` with `class VisitorsSeries(filters)`. `build()` returns `(buckets, totals)`. Mirror the structure of `visits_series.py`.

Steps:
1. Run one query: `VisitQuery(f).rows('started_at', 'session_id', 'session__user_id')`.
2. Compute each row's key with `VisitQuery.visitor_key(user_id, session_id)`.
3. If there are rows, call `FirstVisits(user_ids, anonymous_session_ids)` once. If there are no rows, skip the lookup.
4. Compute `first_bucket[key]`: `None` when `first_visit < f.start_utc`, otherwise `calendar.key_for(first_visit)`.
5. Build buckets with `Series(calendar).group(rows, lambda r: r[_STARTED_AT]).map(reducer)`. The reducer is a bound method or closure that can see `first_bucket` and `calendar`, and computes these as distinct counts over keys:
   - `unique_visitors`
   - `new_visitors`: keys with `first_bucket == bucket start`, where bucket start is `calendar.key_for(rows[0][_STARTED_AT])` and 0 for empty rows
   - `returning_visitors` = unique - new
   - `anonymous`: keys of kind `'session'`
   - `logged_in`: keys of kind `'user'`

   The key order is `KEYS = ('unique_visitors', 'new_visitors', 'returning_visitors', 'anonymous', 'logged_in')`. Every key is present in every bucket.
6. Compute totals as range-level distinct counts over all keys, not bucket sums. `new_visitors` counts keys whose `first_bucket is not None`; `returning_visitors` is the rest.

Export `VisitorsSeries` from `statistics/aggregation/__init__.py`.

Tests in `backend/statistics/tests/aggregation/visitors_series_test.py`, reusing the module helper patterns from `visits_series_test.py` / `overview_totals_test.py`:
- Invariants `new + returning == unique` and `anonymous + logged_in == unique`, on every bucket and in totals.
- Zero-filled buckets, oldest first, clipped first / last buckets (week / month granularity).
- Combinations of audience, user and domain filters:
  - `user` + `audience=anonymous` gives all zeros.
  - An unknown user gives zero-filled buckets.
  - The domain filter does not affect the first-visit lookup: bucket `new_visitors` can add up to less than `totals.new_visitors`.
- Empty range: no lookup query.
- A deleted user becomes session keys.
- An anonymous visitor who later logs in counts as two keys.
- An open visit started before `from` is not counted but makes the visitor returning.
- DST day (Lisbon 2026-03-29).
- Cross-check: on the same fixtures and filters, the totals `unique_visitors`, `new_visitors`, `returning_visitors` and `logged_in` equal the `OverviewTotals(...).build()` keys `unique_visitors`, `new_visitors`, `returning_visitors` and `logged_in_users`.
- Query count: 2 with rows (VisitQuery plus FirstVisits, more if both id sets are non-empty; assert the actual expected number), and 1 with no rows.

## Files to Change
- `backend/statistics/aggregation/visitors_series.py`: new class.
- `backend/statistics/aggregation/__init__.py`: export `VisitorsSeries`.
- `backend/statistics/tests/aggregation/visitors_series_test.py`: new tests.
