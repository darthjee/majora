"""Tests for `statistics.aggregation.granularity.Granularity`."""

from datetime import date, timedelta

from statistics.aggregation import Granularity

FROM = date(2026, 1, 1)


def _to_for(days):
    """Return the inclusive end date of a `days`-long range starting at `FROM`."""
    return FROM + timedelta(days=days - 1)


class TestGranularityResolve:
    """Tests for `Granularity.resolve()`."""

    def test_single_day_resolves_to_day(self):
        """Test that a one-day range resolves to days."""
        assert Granularity.resolve('auto', FROM, FROM) == 'day'

    def test_31_days_resolves_to_day(self):
        """Test that 31 inclusive days is the last range resolving to days."""
        assert Granularity.resolve('auto', FROM, _to_for(31)) == 'day'

    def test_32_days_resolves_to_week(self):
        """Test that 32 inclusive days is the first range resolving to weeks."""
        assert Granularity.resolve('auto', FROM, _to_for(32)) == 'week'

    def test_186_days_resolves_to_week(self):
        """Test that 186 inclusive days is the last range resolving to weeks."""
        assert Granularity.resolve('auto', FROM, _to_for(186)) == 'week'

    def test_187_days_resolves_to_month(self):
        """Test that 187 inclusive days is the first range resolving to months."""
        assert Granularity.resolve('auto', FROM, _to_for(187)) == 'month'

    def test_explicit_override_is_kept_for_a_short_range(self):
        """Test that an explicit `month` is kept even for a range that auto-resolves to days."""
        assert Granularity.resolve('month', FROM, FROM) == 'month'

    def test_explicit_override_is_kept_for_a_long_range(self):
        """Test that an explicit `day` is kept even for a range that auto-resolves to months."""
        assert Granularity.resolve('day', FROM, _to_for(366)) == 'day'

    def test_explicit_week_is_kept(self):
        """Test that an explicit `week` is returned unchanged."""
        assert Granularity.resolve('week', FROM, FROM) == 'week'
