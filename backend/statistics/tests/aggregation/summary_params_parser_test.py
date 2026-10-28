"""Tests for `statistics.aggregation.summary_params_parser.SummaryParamsParser`."""

from datetime import date, datetime, timezone
from unittest.mock import patch

from statistics.aggregation import SummaryParamsParser

TODAY = date(2026, 10, 27)


def _parse(params=None, today=TODAY):
    """Parse `params` (a dict) with an injected `today`."""
    return SummaryParamsParser(params or {}, today=today).parse()


def _errors(params):
    """Return only the errors of parsing `params`."""
    return _parse(params)[1]


class TestSummaryParamsParserDefaults:
    """Tests for the defaults applied when params are omitted."""

    def setup_method(self):
        """Parse an empty query."""
        self.summary, self.errors = _parse()

    def test_has_no_errors(self):
        """Test that an empty query is valid."""
        assert self.errors == {}

    def test_period_defaults_to_day(self):
        """Test that `period` defaults to `day`."""
        assert self.summary.period == 'day'

    def test_tz_defaults_to_utc(self):
        """Test that `tz` defaults to UTC."""
        assert self.summary.filters.tz.key == 'UTC'

    def test_window_is_today_only(self):
        """Test that the default window is `[today, today]`."""
        assert self.summary.filters.from_date == TODAY
        assert self.summary.filters.to_date == TODAY

    def test_granularity_is_resolved(self):
        """Test that the granularity is resolved from `auto`."""
        assert self.summary.filters.requested_granularity == 'auto'
        assert self.summary.filters.granularity == 'day'


class TestSummaryParamsParserPeriods:
    """Tests for the rolling window of each period."""

    def test_day_window(self):
        """Test that `day` covers `[today, today]`."""
        summary, _ = _parse({'period': 'day'})
        assert (summary.filters.from_date, summary.filters.to_date) == (TODAY, TODAY)

    def test_week_window(self):
        """Test that `week` covers `[today − 6, today]`."""
        summary, _ = _parse({'period': 'week'})
        assert summary.period == 'week'
        assert summary.filters.from_date == date(2026, 10, 21)
        assert summary.filters.to_date == TODAY

    def test_month_window(self):
        """Test that `month` covers `[today − 29, today]`."""
        summary, _ = _parse({'period': 'month'})
        assert summary.period == 'month'
        assert summary.filters.from_date == date(2026, 9, 28)
        assert summary.filters.to_date == TODAY

    def test_valid_tz_is_used(self):
        """Test that a valid `tz` is resolved into the filters."""
        summary, errors = _parse({'tz': 'America/Sao_Paulo'})
        assert errors == {}
        assert summary.filters.tz.key == 'America/Sao_Paulo'

    def test_as_dict_echoes_resolved_values(self):
        """Test that `as_dict` echoes the period, window dates and zone."""
        summary, _ = _parse({'period': 'week', 'tz': 'America/Sao_Paulo'})
        assert summary.as_dict() == {
            'period': 'week', 'from': '2026-10-21', 'to': '2026-10-27',
            'tz': 'America/Sao_Paulo',
        }


class TestSummaryParamsParserErrors:
    """Tests for invalid params."""

    def test_invalid_period(self):
        """Test that an unknown `period` records `invalid_period`."""
        assert _errors({'period': 'year'}) == {'period': ['invalid_period']}

    def test_invalid_timezone(self):
        """Test that an unknown `tz` records `invalid_timezone`."""
        assert _errors({'tz': 'Mars/Olympus'}) == {'tz': ['invalid_timezone']}

    def test_both_errors_combined(self):
        """Test that both errors are reported in the same call."""
        assert _errors({'period': 'year', 'tz': 'Mars/Olympus'}) == {
            'period': ['invalid_period'], 'tz': ['invalid_timezone'],
        }

    def test_summary_is_none_on_errors(self):
        """Test that the summary is `None` whenever there are errors."""
        summary, _ = _parse({'period': 'year'})
        assert summary is None

    def test_other_params_are_ignored(self):
        """Test that other statistics params are neither read nor validated."""
        summary, errors = _parse({'from': 'bad', 'granularity': 'bad', 'audience': 'bad'})
        assert errors == {}
        assert summary.filters.from_date == TODAY


class TestSummaryParamsParserToday:
    """Tests for the current local date when `today` is not injected."""

    NOW = datetime(2026, 10, 28, 1, 0, tzinfo=timezone.utc)

    def _parse_at_now(self, params):
        """Parse `params` with `timezone.now()` frozen at `NOW`."""
        with patch('django.utils.timezone.now', return_value=self.NOW):
            return SummaryParamsParser(params).parse()

    def test_today_in_utc(self):
        """Test that today is the UTC date when `tz` is UTC."""
        summary, _ = self._parse_at_now({})
        assert summary.filters.to_date == date(2026, 10, 28)

    def test_today_in_local_zone(self):
        """Test that 01:00 UTC is still the previous day in `America/Sao_Paulo`."""
        summary, _ = self._parse_at_now({'tz': 'America/Sao_Paulo'})
        assert summary.filters.to_date == date(2026, 10, 27)
