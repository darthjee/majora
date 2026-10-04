# Aggregation: bucket calendar, visit query, series, metrics

Complete the aggregator per the spec's "Python aggregator" section:

- `bucket_calendar.py`: `BucketCalendar(filters)`.
  - `buckets()` returns the ordered list of `Bucket(start, end)` (inclusive local dates;
    namedtuple or frozen dataclass) covering the range. The first and last ISO week or month is
    clipped to `from_date` / `to_date`.
  - `key_for(aware_dt)` converts with `astimezone(filters.tz)`, takes the local date, maps it to
    the day itself, the ISO week's Monday or the 1st of the month, then clips to `from_date`.
- `visit_query.py`: `VisitQuery(filters)`.
  - `queryset()` filters `Visit` on `started_at__gte=start_utc` and `started_at__lt=end_utc`,
    plus `session__user_id`, `session__domain_id` (or `session__domain__isnull=True` for
    `unknown`) and the audience (`session__user__isnull`). ORM only.
  - `rows(*fields)` returns `queryset().values_list(*fields)`.
  - The static `visitor_key(user_id, session_id)` returns `('user', id)` or
    `('session', id)`.
- `series.py`: `Series(calendar)`. `group(rows, timestamp_of)` buckets rows by `key_for`.
  `map(reducer)` returns `[{'start', 'end', **reducer(rows)}]` for every bucket, oldest first,
  zero-filled with `reducer([])` (ISO date strings for `start` / `end`).
- `metrics.py`: pure functions, no DB.
  - `count(values)` and `unique(keys)`.
  - `average(values)` and `median(values)` return `None` on empty input. The even-length median
    is the mean of the two middle values.
  - `histogram(values, edges)` returns `[{'lower', 'upper', 'count'}]`. The last bin has
    `upper=None`, and values below the first edge count in the first bin.
  - Never import the stdlib `statistics` module.

Tests (`backend/statistics/tests/aggregation/`):

- `bucket_calendar_test.py`: day / week / month buckets, ISO week clipping at both ends, month
  clipping, a DST day bucketed correctly (a timestamp just after local midnight on a
  transition day), and `key_for` near bucket edges in a non-UTC zone.
- `visit_query_test.py` (DB): range boundaries (inclusive start, exclusive end), user / domain /
  `unknown` / audience filters, `user` combined with `anonymous` returning empty, an unknown id
  returning empty, and `visitor_key`.
- `series_test.py`: grouping plus zero-filling of empty buckets, and ordering.
- `metrics_test.py`: every helper, including empty input, odd/even median, and histogram edges
  (below the first edge, exactly on an edge, the open last bin).

## Files to Change

- `backend/statistics/aggregation/bucket_calendar.py`: new.
- `backend/statistics/aggregation/visit_query.py`: new.
- `backend/statistics/aggregation/series.py`: new.
- `backend/statistics/aggregation/metrics.py`: new.
- `backend/statistics/aggregation/__init__.py`: re-export the new classes.
- `backend/statistics/tests/aggregation/bucket_calendar_test.py`: new.
- `backend/statistics/tests/aggregation/visit_query_test.py`: new.
- `backend/statistics/tests/aggregation/series_test.py`: new.
- `backend/statistics/tests/aggregation/metrics_test.py`: new.
