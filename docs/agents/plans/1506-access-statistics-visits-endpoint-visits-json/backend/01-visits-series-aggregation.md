# Add the VisitsSeries aggregation

Create `VisitsSeries(filters)` with a single public method (e.g. `build()`) returning
`(buckets, totals)`:

- `rows = VisitQuery(filters).rows('started_at', 'session__user_id')` — one query.
- `buckets = Series(BucketCalendar(filters)).group(rows, lambda row: row[0]).map(reducer)`.
- `reducer(rows)` partitions rows on `row[1] is None` and returns
  `{'anonymous': metrics.count(anon), 'logged_in': metrics.count(logged), 'visits': anon + logged}`;
  `reducer([])` returns all zeros, which zero-fills empty buckets.
- `totals` = per-key sum of the buckets (`{'anonymous': 0, 'logged_in': 0, 'visits': 0}` when
  there are none).

Export it from `statistics/aggregation/__init__.py` (import + `__all__`, alphabetical) and mention
it in the package docstring if appropriate.

Tests (pytest, `@pytest.mark.django_db`, following `visit_query_test.py` helpers that build
`Session` / `Visit` rows and `StatisticsFilters` directly):

- split by audience: a session with a user counts as `logged_in`, without as `anonymous`;
  `visits == anonymous + logged_in` on every bucket and in totals; totals equal the bucket sums;
- zero-filled empty range (no visits) and gaps between days, oldest first;
- `audience=anonymous` / `logged_in`: both keys present, the filtered-out one is `0` everywhere;
- `user` filter: only that user's visits (`anonymous` all `0`); `user` + `audience=anonymous`
  → all zeros; unknown user id and unknown domain id → zero-filled;
- `domain` filter by id and `domain=unknown` (session without domain);
- visit started before `from` but still open in range is not counted; an open visit counts in
  its start bucket; start inclusive / end exclusive;
- a visit whose user was deleted (session `user = NULL`) counts as anonymous;
- week / month granularity: clipped first / last bucket `start` / `end`, visits counted in the
  right bucket;
- DST: in `Europe/Lisbon`, visits around the transition day land in the correct local day (e.g.
  23:30 local on the 23 h day vs 00:30 the next day).

## Files to Change

- `backend/statistics/aggregation/visits_series.py` — new `VisitsSeries` class.
- `backend/statistics/aggregation/__init__.py` — export `VisitsSeries`.
- `backend/statistics/tests/aggregation/visits_series_test.py` — new tests.
