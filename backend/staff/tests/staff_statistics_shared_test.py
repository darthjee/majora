"""Tests for the shared staff statistics view helpers."""

from datetime import date
from zoneinfo import ZoneInfo

from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from staff.views._staff_statistics_shared import parse_statistics_filters, statistics_envelope
from statistics.aggregation import StatisticsFilters


def _request(params):
    """Return a DRF request carrying `params` as its query string."""
    return Request(APIRequestFactory().get('/staff/statistics/x.json', params))


class TestParseStatisticsFilters:
    """Tests for `parse_statistics_filters()`."""

    def test_valid_params_return_filters(self):
        """Test that valid params return the parsed filters and no response."""
        filters, error_response = parse_statistics_filters(
            _request({'from': '2026-01-01', 'to': '2026-01-31', 'tz': 'Europe/Lisbon'}),
        )
        assert error_response is None
        assert filters.from_date == date(2026, 1, 1)
        assert filters.tz.key == 'Europe/Lisbon'

    def test_invalid_params_return_400_with_every_error(self):
        """Test that invalid params give a 400 listing every error at once."""
        filters, error_response = parse_statistics_filters(
            _request({'tz': 'Nowhere', 'audience': 'bots', 'from': 'x'}),
        )
        assert filters is None
        assert error_response.status_code == 400
        assert error_response.data == {'errors': {
            'tz': ['invalid_timezone'],
            'audience': ['invalid_audience'],
            'from': ['invalid_date'],
        }}


class TestStatisticsEnvelope:
    """Tests for `statistics_envelope()`."""

    def setup_method(self):
        """Build resolved filters."""
        self.filters = StatisticsFilters(
            from_date=date(2026, 1, 1), to_date=date(2026, 1, 1), tz=ZoneInfo('UTC'),
            granularity='day', requested_granularity='auto',
        )

    def test_full_envelope(self):
        """Test that filters, buckets, totals and extra keys are included."""
        buckets = [{'start': '2026-01-01', 'end': '2026-01-01', 'visits': 2}]
        envelope = statistics_envelope(
            self.filters, buckets=buckets, totals={'visits': 2}, histogram=[],
        )
        assert envelope == {
            'filters': self.filters.as_dict(),
            'buckets': buckets,
            'totals': {'visits': 2},
            'histogram': [],
        }

    def test_omits_missing_buckets_and_totals(self):
        """Test that buckets and totals are omitted when not given."""
        assert statistics_envelope(self.filters) == {'filters': self.filters.as_dict()}

    def test_keeps_empty_buckets(self):
        """Test that an empty buckets list is kept (only `None` is omitted)."""
        assert statistics_envelope(self.filters, buckets=[])['buckets'] == []
