# Shared visit-duration helper

Move the whole-second per-visit duration out of the private
`OverviewTotals._duration_seconds` into a small public helper, so Overview and Duration
cannot drift apart. Recommended: a pure function in `statistics/aggregation/metrics.py`,
e.g. `duration_seconds(started_at, last_seen_at)` returning
`int((last_seen_at - started_at).total_seconds())` (keep the module DB-free; it takes two
datetimes, not a row). Update `OverviewTotals` to call it (unpack the row indexes there) and
drop `_duration_seconds`. Overview's behaviour and tests must stay unchanged.

Add unit tests for the helper in `metrics_test.py`: zero for equal timestamps, truncation of
sub-second parts (e.g. 1.9 s → 1), and a multi-hour span.

## Files to Change

- `backend/statistics/aggregation/metrics.py` — add `duration_seconds(started_at, last_seen_at)`.
- `backend/statistics/aggregation/overview_totals.py` — use `metrics.duration_seconds`, remove `_duration_seconds`.
- `backend/statistics/tests/aggregation/metrics_test.py` — tests for the new helper.
