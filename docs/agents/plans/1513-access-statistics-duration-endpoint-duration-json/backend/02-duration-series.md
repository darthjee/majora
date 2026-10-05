# DurationSeries aggregator

Create `statistics/aggregation/duration_series.py` with `DurationSeries(filters)` and a
`build()` returning `(buckets, totals, histogram)`, mirroring `VisitsSeries`' style
(module-level row index constants, docstrings on every method).

- One query: `rows = list(VisitQuery(filters).rows('started_at', 'last_seen_at', 'hits'))`
  (materialise once; it is reused for buckets, totals and histogram).
- `buckets = Series(BucketCalendar(filters)).group(rows, lambda row: row[_STARTED_AT]).map(self._reduce)`.
- `totals = self._reduce(rows)` — over all rows, never from buckets.
- `histogram = metrics.histogram(durations_of_all_rows, HISTOGRAM_EDGES)` with
  `HISTOGRAM_EDGES = (0, 1, 30, 60, 180, 600, 1800, 3600)` (class constant; pass a list if
  `bisect` needs it — tuples work).
- `_reduce(rows)` returns, in this key order: `visits` (`metrics.count`),
  `single_hit_visits` (rows with `hits == 1`), `average_duration_seconds`
  (`round(metrics.average(durations))` or `None`), `median_duration_seconds`
  (`round(metrics.median(durations))` or `None`), `average_hits`
  (`round(metrics.average(hits), 1)` or `None`), `median_hits` (`metrics.median(hits)` as is).
  Durations come from `metrics.duration_seconds` (step 01). `_reduce([])` yields `0` / `None`
  values, which zero-fills empty buckets.

Export `DurationSeries` from `statistics/aggregation/__init__.py` (import + `__all__`, and
mention it in the module docstring list).

Tests in `statistics/tests/aggregation/duration_series_test.py`, reusing the helpers style of
`visits_series_test.py` (`_build`, `_at`, `_visit`, `_session`; set `hits` on visits):

- six keys per bucket and in totals; buckets bucketed by `started_at`;
- empty range: every bucket `0` / `None`, totals `0` / `None`, histogram eight bins at `0`;
- single-hit visits counted in `single_hit_visits` and included in average / median;
- even-count medians: duration rounded to int, `median_hits` keeps `.5`;
- `average_hits` rounded to one decimal;
- totals computed over all rows (a case where the average of bucket averages differs);
- histogram: eight bins, edges and `upper: None` on the last, half-open boundaries
  (`0`, `1`, `29`, `30`, `3599`, `3600`), counts sum to `totals['visits']`;
- open visit counts with its current duration; visit started before `from` excluded;
- `user`, `domain`, `audience` filters, `user` + `audience=anonymous` zero-filled, unknown
  user zero-filled, deleted user counted as anonymous;
- week / month granularity with clipped first / last buckets; a DST-transition day bucket
  (e.g. `Europe/Lisbon` on 2026-03-29) with a visit spanning the change keeping its UTC length;
- `totals['visits']` and `totals['average_duration_seconds']` equal `OverviewTotals(filters).build()`'s
  for the same filters;
- query count: a single query (`django_assert_num_queries(1)`).

## Files to Change

- `backend/statistics/aggregation/duration_series.py` — new `DurationSeries`.
- `backend/statistics/aggregation/__init__.py` — export `DurationSeries`.
- `backend/statistics/tests/aggregation/duration_series_test.py` — new tests.
