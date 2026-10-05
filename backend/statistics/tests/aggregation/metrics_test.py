"""Tests for `statistics.aggregation.metrics`."""

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from statistics.aggregation import metrics


class TestCount:
    """Tests for `metrics.count()`."""

    def test_counts_values(self):
        """Test that the number of values is returned."""
        assert metrics.count([3, 3, 1]) == 3

    def test_empty(self):
        """Test that an empty list counts zero."""
        assert metrics.count([]) == 0


class TestUnique:
    """Tests for `metrics.unique()`."""

    def test_counts_distinct_keys(self):
        """Test that duplicate visitor keys are counted once."""
        keys = [('user', 1), ('session', 1), ('user', 1)]
        assert metrics.unique(keys) == 2

    def test_empty(self):
        """Test that no keys give zero."""
        assert metrics.unique([]) == 0


class TestAverage:
    """Tests for `metrics.average()`."""

    def test_mean(self):
        """Test that the arithmetic mean is returned."""
        assert metrics.average([1, 2, 6]) == 3

    def test_empty_is_none(self):
        """Test that an empty input gives `None`."""
        assert metrics.average([]) is None


class TestMedian:
    """Tests for `metrics.median()`."""

    def test_odd_length(self):
        """Test that the middle value of an odd-length list is returned."""
        assert metrics.median([9, 1, 5]) == 5

    def test_even_length_is_mean_of_middle_values(self):
        """Test that an even-length median is the mean of the two middle values."""
        assert metrics.median([4, 1, 10, 2]) == 3

    def test_single_value(self):
        """Test that a single value is its own median."""
        assert metrics.median([7]) == 7

    def test_empty_is_none(self):
        """Test that an empty input gives `None`."""
        assert metrics.median([]) is None


class TestDurationSeconds:
    """Tests for `metrics.duration_seconds()`."""

    def setup_method(self):
        """Set up a reference start time."""
        self.started_at = datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc)

    def test_equal_timestamps_give_zero(self):
        """Test that a visit ending when it started lasts zero seconds."""
        assert metrics.duration_seconds(self.started_at, self.started_at) == 0

    def test_truncates_sub_seconds(self):
        """Test that sub-second parts are truncated, not rounded."""
        last_seen_at = self.started_at + timedelta(seconds=1, milliseconds=900)
        assert metrics.duration_seconds(self.started_at, last_seen_at) == 1

    def test_multi_hour_span(self):
        """Test that a multi-hour span is returned in whole seconds."""
        last_seen_at = self.started_at + timedelta(hours=3, minutes=2, seconds=5)
        assert metrics.duration_seconds(self.started_at, last_seen_at) == 10925


class TestIsoUtc:
    """Tests for `metrics.iso_utc()`."""

    def test_utc_value(self):
        """Test that a UTC datetime is rendered with a `Z` suffix."""
        value = datetime(2026, 1, 2, 3, 4, 5, tzinfo=timezone.utc)
        assert metrics.iso_utc(value) == '2026-01-02T03:04:05Z'

    def test_converts_to_utc(self):
        """Test that a datetime in another time zone is converted to UTC."""
        value = datetime(2026, 1, 2, 0, 30, tzinfo=ZoneInfo('America/Sao_Paulo'))
        assert metrics.iso_utc(value) == '2026-01-02T03:30:00Z'

    def test_drops_sub_seconds(self):
        """Test that sub-second parts are dropped."""
        value = datetime(2026, 1, 2, 3, 4, 5, 999999, tzinfo=timezone.utc)
        assert metrics.iso_utc(value) == '2026-01-02T03:04:05Z'


class TestHistogram:
    """Tests for `metrics.histogram()`."""

    def test_bins_values(self):
        """Test that values fall in `[lower, upper)` bins with an open last bin."""
        assert metrics.histogram([10, 70, 500, 1000], [0, 60, 300]) == [
            {'lower': 0, 'upper': 60, 'count': 1},
            {'lower': 60, 'upper': 300, 'count': 1},
            {'lower': 300, 'upper': None, 'count': 2},
        ]

    def test_value_on_an_edge_goes_to_the_upper_bin(self):
        """Test that a value equal to an edge is counted in the bin starting there."""
        result = metrics.histogram([60], [0, 60, 300])
        assert [bin_['count'] for bin_ in result] == [0, 1, 0]

    def test_values_below_first_edge_count_in_first_bin(self):
        """Test that values below the first edge are counted in the first bin."""
        result = metrics.histogram([-5, 3], [10, 60])
        assert [bin_['count'] for bin_ in result] == [2, 0]

    def test_empty_values_give_zero_bins(self):
        """Test that every bin is present with zero counts for empty input."""
        assert metrics.histogram([], [0, 60]) == [
            {'lower': 0, 'upper': 60, 'count': 0},
            {'lower': 60, 'upper': None, 'count': 0},
        ]
