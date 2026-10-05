"""Tests for `statistics.aggregation.series.Series`."""

from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from statistics.aggregation import BucketCalendar, Series, StatisticsFilters, metrics


def _series(from_date, to_date, granularity='day'):
    """Build a `Series` over a UTC range."""
    return Series(BucketCalendar(StatisticsFilters(
        from_date=from_date, to_date=to_date, tz=ZoneInfo('UTC'),
        granularity=granularity, requested_granularity=granularity,
    )))


def _count_reducer(rows):
    """Reduce rows to their count."""
    return {'visits': metrics.count(rows)}


def _row(day, hits=1):
    """Return a `(started_at, hits)` row on `day` at noon UTC."""
    return (datetime(2026, 1, day, 12, tzinfo=timezone.utc), hits)


class TestSeries:
    """Tests for `Series.group()` and `Series.map()`."""

    def test_zero_fills_without_rows(self):
        """Test that every bucket is present with `reducer([])` when there are no rows."""
        result = _series(date(2026, 1, 1), date(2026, 1, 2)).map(_count_reducer)
        assert result == [
            {'start': '2026-01-01', 'end': '2026-01-01', 'visits': 0},
            {'start': '2026-01-02', 'end': '2026-01-02', 'visits': 0},
        ]

    def test_groups_rows_and_zero_fills_gaps(self):
        """Test that rows are grouped per bucket and empty buckets are zero-filled."""
        rows = [_row(3), _row(1), _row(3)]
        series = _series(date(2026, 1, 1), date(2026, 1, 3)).group(rows, lambda row: row[0])
        assert [entry['visits'] for entry in series.map(_count_reducer)] == [1, 0, 2]

    def test_entries_are_oldest_first(self):
        """Test that entries follow the calendar order regardless of row order."""
        rows = [_row(2), _row(1)]
        series = _series(date(2026, 1, 1), date(2026, 1, 2)).group(rows, lambda row: row[0])
        assert [entry['start'] for entry in series.map(_count_reducer)] == [
            '2026-01-01', '2026-01-02',
        ]

    def test_reducer_receives_the_bucket_rows(self):
        """Test that the reducer is given the full rows of its bucket."""
        rows = [_row(1, hits=2), _row(1, hits=5)]
        series = _series(date(2026, 1, 1), date(2026, 1, 1)).group(rows, lambda row: row[0])
        result = series.map(lambda bucket: {'hits': sum(row[1] for row in bucket)})
        assert result == [{'start': '2026-01-01', 'end': '2026-01-01', 'hits': 7}]

    def test_clipped_week_dates_are_serialized(self):
        """Test that clipped bucket bounds are serialized as ISO dates."""
        rows = [_row(8)]
        series = _series(date(2026, 1, 7), date(2026, 1, 13), 'week')
        result = series.group(rows, lambda row: row[0]).map(_count_reducer)
        assert result == [
            {'start': '2026-01-07', 'end': '2026-01-11', 'visits': 1},
            {'start': '2026-01-12', 'end': '2026-01-13', 'visits': 0},
        ]
