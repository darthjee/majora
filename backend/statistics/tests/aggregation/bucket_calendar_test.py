"""Tests for `statistics.aggregation.bucket_calendar.BucketCalendar`."""

from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from statistics.aggregation import Bucket, BucketCalendar, StatisticsFilters


def _calendar(from_date, to_date, granularity, tz='UTC'):
    """Build a `BucketCalendar` over the given range."""
    return BucketCalendar(StatisticsFilters(
        from_date=from_date, to_date=to_date, tz=ZoneInfo(tz),
        granularity=granularity, requested_granularity=granularity,
    ))


def _utc(*args):
    """Return an aware UTC datetime."""
    return datetime(*args, tzinfo=timezone.utc)


class TestBucketCalendarDayBuckets:
    """Tests for daily buckets."""

    def test_one_bucket_per_day(self):
        """Test that each day of the range is its own bucket."""
        calendar = _calendar(date(2026, 1, 1), date(2026, 1, 3), 'day')
        assert calendar.buckets() == [
            Bucket(date(2026, 1, 1), date(2026, 1, 1)),
            Bucket(date(2026, 1, 2), date(2026, 1, 2)),
            Bucket(date(2026, 1, 3), date(2026, 1, 3)),
        ]

    def test_single_day_range(self):
        """Test that a one-day range has a single bucket."""
        calendar = _calendar(date(2026, 1, 1), date(2026, 1, 1), 'day')
        assert calendar.buckets() == [Bucket(date(2026, 1, 1), date(2026, 1, 1))]

    def test_366_daily_buckets_over_the_cap(self):
        """Test that the full cap with day granularity gives 366 buckets."""
        calendar = _calendar(date(2025, 4, 1), date(2026, 4, 1), 'day')
        assert len(calendar.buckets()) == 366


class TestBucketCalendarWeekBuckets:
    """Tests for ISO week buckets."""

    def test_weeks_are_clipped_at_both_ends(self):
        """Test that the first and last ISO weeks are clipped to the range."""
        calendar = _calendar(date(2026, 1, 7), date(2026, 1, 21), 'week')
        assert calendar.buckets() == [
            Bucket(date(2026, 1, 7), date(2026, 1, 11)),
            Bucket(date(2026, 1, 12), date(2026, 1, 18)),
            Bucket(date(2026, 1, 19), date(2026, 1, 21)),
        ]

    def test_aligned_weeks_are_full(self):
        """Test that a Monday-to-Sunday range gives whole weeks."""
        calendar = _calendar(date(2026, 1, 5), date(2026, 1, 18), 'week')
        assert calendar.buckets() == [
            Bucket(date(2026, 1, 5), date(2026, 1, 11)),
            Bucket(date(2026, 1, 12), date(2026, 1, 18)),
        ]

    def test_week_crossing_the_year(self):
        """Test that an ISO week spanning New Year is a single bucket."""
        calendar = _calendar(date(2025, 12, 29), date(2026, 1, 4), 'week')
        assert calendar.buckets() == [Bucket(date(2025, 12, 29), date(2026, 1, 4))]


class TestBucketCalendarMonthBuckets:
    """Tests for month buckets."""

    def test_months_are_clipped_at_both_ends(self):
        """Test that the first and last months are clipped to the range."""
        calendar = _calendar(date(2026, 1, 15), date(2026, 3, 10), 'month')
        assert calendar.buckets() == [
            Bucket(date(2026, 1, 15), date(2026, 1, 31)),
            Bucket(date(2026, 2, 1), date(2026, 2, 28)),
            Bucket(date(2026, 3, 1), date(2026, 3, 10)),
        ]

    def test_month_crossing_the_year(self):
        """Test that December rolls over to January."""
        calendar = _calendar(date(2025, 12, 31), date(2026, 1, 1), 'month')
        assert calendar.buckets() == [
            Bucket(date(2025, 12, 31), date(2025, 12, 31)),
            Bucket(date(2026, 1, 1), date(2026, 1, 1)),
        ]

    def test_leap_february(self):
        """Test that a leap-year February ends on the 29th."""
        calendar = _calendar(date(2028, 2, 1), date(2028, 3, 1), 'month')
        assert calendar.buckets()[0] == Bucket(date(2028, 2, 1), date(2028, 2, 29))


class TestBucketCalendarKeyFor:
    """Tests for `BucketCalendar.key_for()`."""

    def test_day_key_is_the_local_date(self):
        """Test that a UTC timestamp maps to its local day in a zone behind UTC."""
        calendar = _calendar(date(2026, 1, 1), date(2026, 1, 31), 'day', 'America/Sao_Paulo')
        assert calendar.key_for(_utc(2026, 1, 11, 2, 59)) == date(2026, 1, 10)
        assert calendar.key_for(_utc(2026, 1, 11, 3, 0)) == date(2026, 1, 11)

    def test_week_key_near_monday_midnight(self):
        """Test that local Sunday 23:59 and Monday 00:00 fall in different weeks."""
        calendar = _calendar(date(2026, 1, 1), date(2026, 1, 31), 'week', 'America/Sao_Paulo')
        assert calendar.key_for(_utc(2026, 1, 12, 2, 59)) == date(2026, 1, 5)
        assert calendar.key_for(_utc(2026, 1, 12, 3, 0)) == date(2026, 1, 12)

    def test_month_key_near_month_edge(self):
        """Test that the last local instant of a month maps to that month in a zone ahead."""
        calendar = _calendar(date(2026, 1, 1), date(2026, 3, 31), 'month', 'Asia/Tokyo')
        assert calendar.key_for(_utc(2026, 1, 31, 14, 59)) == date(2026, 1, 1)
        assert calendar.key_for(_utc(2026, 1, 31, 15, 0)) == date(2026, 2, 1)

    def test_key_is_clipped_to_from_date(self):
        """Test that a key in the clipped first week is the range start, not the Monday."""
        calendar = _calendar(date(2026, 1, 7), date(2026, 1, 21), 'week')
        assert calendar.key_for(_utc(2026, 1, 8, 12)) == date(2026, 1, 7)

    def test_spring_forward_day(self):
        """Test bucketing around the Lisbon spring-forward day (a 23 h local day)."""
        calendar = _calendar(date(2026, 3, 28), date(2026, 3, 30), 'day', 'Europe/Lisbon')
        assert calendar.key_for(_utc(2026, 3, 28, 23, 59)) == date(2026, 3, 28)
        assert calendar.key_for(_utc(2026, 3, 29, 0, 1)) == date(2026, 3, 29)
        assert calendar.key_for(_utc(2026, 3, 29, 22, 59)) == date(2026, 3, 29)
        assert calendar.key_for(_utc(2026, 3, 29, 23, 1)) == date(2026, 3, 30)

    def test_fall_back_day(self):
        """Test bucketing around the Lisbon fall-back day (a 25 h local day)."""
        calendar = _calendar(date(2026, 10, 24), date(2026, 10, 26), 'day', 'Europe/Lisbon')
        assert calendar.key_for(_utc(2026, 10, 24, 22, 59)) == date(2026, 10, 24)
        assert calendar.key_for(_utc(2026, 10, 24, 23, 1)) == date(2026, 10, 25)
        assert calendar.key_for(_utc(2026, 10, 25, 23, 59)) == date(2026, 10, 25)
        assert calendar.key_for(_utc(2026, 10, 26, 0, 1)) == date(2026, 10, 26)
