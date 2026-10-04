"""Tests for `statistics.aggregation.filters.StatisticsFilters`."""

from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

import pytest

from statistics.aggregation import StatisticsFilters


def _filters(from_date, to_date, tz='UTC', **kwargs):
    """Build a `StatisticsFilters` with sensible defaults."""
    return StatisticsFilters(
        from_date=from_date, to_date=to_date, tz=ZoneInfo(tz),
        granularity='day', requested_granularity='auto', **kwargs,
    )


class TestStatisticsFiltersInterval:
    """Tests for `StatisticsFilters.start_utc` / `end_utc`."""

    def test_utc_interval_is_whole_days(self):
        """Test that in UTC the interval runs from `from` midnight to the day after `to`."""
        filters = _filters(date(2026, 1, 1), date(2026, 1, 31))
        assert filters.start_utc == datetime(2026, 1, 1, tzinfo=timezone.utc)
        assert filters.end_utc == datetime(2026, 2, 1, tzinfo=timezone.utc)

    def test_interval_spanning_spring_forward(self):
        """Test the Lisbon interval across the March DST change (WET to WEST)."""
        filters = _filters(date(2026, 3, 28), date(2026, 3, 29), tz='Europe/Lisbon')
        assert filters.start_utc == datetime(2026, 3, 28, 0, tzinfo=timezone.utc)
        assert filters.end_utc == datetime(2026, 3, 29, 23, tzinfo=timezone.utc)

    def test_interval_spanning_fall_back(self):
        """Test the Lisbon interval across the October DST change (WEST to WET)."""
        filters = _filters(date(2026, 10, 25), date(2026, 10, 25), tz='Europe/Lisbon')
        assert filters.start_utc == datetime(2026, 10, 24, 23, tzinfo=timezone.utc)
        assert filters.end_utc == datetime(2026, 10, 26, 0, tzinfo=timezone.utc)

    def test_interval_in_a_negative_offset_zone(self):
        """Test that a zone behind UTC shifts the interval forward."""
        filters = _filters(date(2026, 1, 1), date(2026, 1, 1), tz='America/Sao_Paulo')
        assert filters.start_utc == datetime(2026, 1, 1, 3, tzinfo=timezone.utc)
        assert filters.end_utc == datetime(2026, 1, 2, 3, tzinfo=timezone.utc)


class TestStatisticsFiltersAsDict:
    """Tests for `StatisticsFilters.as_dict()`."""

    def test_returns_the_envelope_echo(self):
        """Test that `as_dict()` returns ISO dates, the zone key and every filter."""
        filters = StatisticsFilters(
            from_date=date(2026, 1, 1), to_date=date(2026, 3, 31),
            tz=ZoneInfo('Europe/Lisbon'), granularity='week', requested_granularity='auto',
            user_id=None, domain='unknown', audience='all',
        )
        assert filters.as_dict() == {
            'from': '2026-01-01',
            'to': '2026-03-31',
            'tz': 'Europe/Lisbon',
            'granularity': 'week',
            'requested_granularity': 'auto',
            'user': None,
            'domain': 'unknown',
            'audience': 'all',
        }

    def test_echoes_user_and_domain_ids(self):
        """Test that integer user and domain ids are echoed as-is."""
        filters = _filters(date(2026, 1, 1), date(2026, 1, 1), user_id=3, domain=7)
        assert filters.as_dict()['user'] == 3
        assert filters.as_dict()['domain'] == 7


class TestStatisticsFiltersFrozen:
    """Tests for the immutability of `StatisticsFilters`."""

    def test_cannot_be_mutated(self):
        """Test that assigning a field raises."""
        filters = _filters(date(2026, 1, 1), date(2026, 1, 1))
        with pytest.raises(AttributeError):
            filters.audience = 'anonymous'
