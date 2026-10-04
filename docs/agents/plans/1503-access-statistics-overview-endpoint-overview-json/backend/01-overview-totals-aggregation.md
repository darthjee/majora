# Add the OverviewTotals aggregation

Create `OverviewTotals(filters)` with a public `build()` that returns the `totals` dict.

1. One query: `VisitQuery(filters).rows('started_at', 'last_seen_at', 'session_id',
   'session__user_id')` (materialize it once as a list).
2. From the rows, in Python:
   - `visits` = `metrics.count(rows)`;
   - visitor keys via `VisitQuery.visitor_key(user_id, session_id)`;
     `unique_visitors` = `metrics.unique(keys)`;
   - `logged_in_users` = `metrics.unique` of the non-null `session__user_id` values;
   - `average_duration_seconds` = `metrics.average` of whole-second durations
     (`int((last_seen_at - started_at).total_seconds())`), rounded with `round()`, or `None`
     when there are no rows. Open visits use their current `last_seen_at`; single-hit visits
     count as `0`.
3. Earlier-visits lookup, **skipped when there are no rows** (no extra queries):
   - users: `Visit.objects.filter(started_at__lt=filters.start_utc,
     session__user_id__in=<user ids>).values_list('session__user_id', flat=True).distinct()`;
   - anonymous: `Visit.objects.filter(started_at__lt=filters.start_utc,
     session_id__in=<anonymous session ids>, session__user__isnull=True)
     .values_list('session_id', flat=True).distinct()`;
   - skip each sub-query whose id set is empty. Neither lookup applies the `domain` /
     `audience` / `user` filters (first visit ever, any domain).
   - `returning_visitors` = number of in-range keys found; `new_visitors` =
     `unique_visitors - returning_visitors`.
4. Export `OverviewTotals` from `statistics/aggregation/__init__.py` (import + `__all__`, and
   mention it in the module docstring next to `VisitsSeries`).

Tests (pytest-django, same helpers style as `visits_series_test.py`) should cover:
- empty range → all zeros, `average_duration_seconds is None`, and no earlier-visits queries
  (`django_assert_num_queries(1)`);
- counts, unique visitors and logged-in users with mixed anonymous / logged-in visits;
- average duration rounding, open and single-hit visits;
- `new + returning == unique`; a visit before `from` makes the key returning, including when
  the earlier visit is on another domain while `domain` filters the range;
- `user` filter (`0`/`1`, unknown id → zeros), `audience=anonymous` (`logged_in_users == 0`,
  anonymous keys only), `audience=logged_in` (`unique_visitors == logged_in_users`), `user` +
  `audience=anonymous` → zeros, `domain=unknown`;
- anonymous session and later logged-in user counted as two keys; deleted users (session
  `user = NULL`) counted as anonymous;
- a visit started just before `from` and continuing into the range is not counted.

## Files to Change
- `backend/statistics/aggregation/overview_totals.py` — new `OverviewTotals` class.
- `backend/statistics/aggregation/__init__.py` — export `OverviewTotals`.
- `backend/statistics/tests/aggregation/overview_totals_test.py` — new tests.
