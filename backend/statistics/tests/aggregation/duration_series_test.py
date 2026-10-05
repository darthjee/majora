"""Tests for `statistics.aggregation.duration_series.DurationSeries`."""

from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import pytest

from domains.tests.factories import DomainFactory
from games.tests.factories import UserFactory
from statistics.aggregation import DurationSeries, OverviewTotals, StatisticsFilters
from statistics.models import Session, Visit

EMPTY = {
    'visits': 0,
    'single_hit_visits': 0,
    'average_duration_seconds': None,
    'median_duration_seconds': None,
    'average_hits': None,
    'median_hits': None,
}

EDGES = [0, 1, 30, 60, 180, 600, 1800, 3600]


def _filters(from_date=date(2026, 1, 1), to_date=date(2026, 1, 3), tz='UTC',
             granularity='day', **kwargs):
    """Return statistics filters over the given range."""
    return StatisticsFilters(
        from_date=from_date, to_date=to_date, tz=ZoneInfo(tz),
        granularity=granularity, requested_granularity='auto', **kwargs,
    )


def _build(**kwargs):
    """Return `(buckets, totals, histogram)` of a `DurationSeries` over the given filters."""
    return DurationSeries(_filters(**kwargs)).build()


def _at(day, hour=12, month=1, year=2026):
    """Return an aware UTC datetime."""
    return datetime(year, month, day, hour, tzinfo=timezone.utc)


def _visit(session, started_at, seconds=0, hits=1):
    """Create a visit of `session` started at `started_at`, lasting `seconds` with `hits`."""
    return Visit.objects.create(
        session=session, started_at=started_at,
        last_seen_at=started_at + timedelta(seconds=seconds), hits=hits,
    )


def _session(**kwargs):
    """Create a statistics session."""
    return Session.objects.create(ip='127.0.0.1', **kwargs)


def _values(buckets, key):
    """Return the `key` value of every bucket, in order."""
    return [bucket[key] for bucket in buckets]


def _bin_counts(histogram):
    """Return the count of every histogram bin, in order."""
    return [entry['count'] for entry in histogram]


@pytest.mark.django_db
class TestDurationSeriesMetrics:
    """Tests for the per-bucket and total metrics of `DurationSeries`."""

    def setup_method(self):
        """Set up anonymous and logged-in visits over three days."""
        self.user = UserFactory()
        anonymous = _session()
        logged_in = _session(user=self.user)
        _visit(anonymous, _at(1), seconds=10, hits=1)
        _visit(logged_in, _at(1, 13), seconds=50, hits=3)
        _visit(logged_in, _at(3), seconds=100, hits=2)

    def test_buckets(self):
        """Test that visits are bucketed by `started_at` with the six metrics."""
        buckets, _, _ = _build()
        assert buckets == [
            {'start': '2026-01-01', 'end': '2026-01-01', 'visits': 2, 'single_hit_visits': 1,
             'average_duration_seconds': 30, 'median_duration_seconds': 30,
             'average_hits': 2.0, 'median_hits': 2.0},
            {'start': '2026-01-02', 'end': '2026-01-02', **EMPTY},
            {'start': '2026-01-03', 'end': '2026-01-03', 'visits': 1, 'single_hit_visits': 0,
             'average_duration_seconds': 100, 'median_duration_seconds': 100,
             'average_hits': 2.0, 'median_hits': 2},
        ]

    def test_totals_are_computed_over_all_rows(self):
        """Test that totals reduce all rows instead of averaging the bucket averages."""
        _, totals, _ = _build()
        assert totals == {
            'visits': 3,
            'single_hit_visits': 1,
            'average_duration_seconds': 53,
            'median_duration_seconds': 50,
            'average_hits': 2.0,
            'median_hits': 2,
        }

    def test_totals_match_overview(self):
        """Test that visits and average duration equal the overview totals."""
        _, totals, _ = _build()
        overview = OverviewTotals(_filters()).build()
        assert totals['visits'] == overview['visits']
        assert totals['average_duration_seconds'] == overview['average_duration_seconds']

    def test_histogram_counts_sum_to_visits(self):
        """Test that the histogram counts add up to the total visits."""
        _, totals, histogram = _build()
        assert sum(_bin_counts(histogram)) == totals['visits']

    def test_user_filter(self):
        """Test that the `user` filter keeps only that user's visits."""
        buckets, totals, _ = _build(user_id=self.user.id)
        assert _values(buckets, 'visits') == [1, 0, 1]
        assert totals['visits'] == 2

    def test_anonymous_audience(self):
        """Test that `audience=anonymous` keeps only visits without a user."""
        _, totals, _ = _build(audience='anonymous')
        assert totals['visits'] == 1
        assert totals['average_duration_seconds'] == 10

    def test_logged_in_audience(self):
        """Test that `audience=logged_in` keeps only visits with a user."""
        _, totals, _ = _build(audience='logged_in')
        assert totals['visits'] == 2
        assert totals['average_duration_seconds'] == 75

    def test_user_with_anonymous_audience_is_empty(self):
        """Test that `user` combined with `audience=anonymous` yields only empty values."""
        buckets, totals, _ = _build(user_id=self.user.id, audience='anonymous')
        assert totals == EMPTY
        assert [bucket for bucket in buckets if bucket['visits']] == []

    def test_unknown_user_is_empty(self):
        """Test that a missing user id yields empty buckets and totals."""
        buckets, totals, _ = _build(user_id=999999)
        assert len(buckets) == 3
        assert totals == EMPTY

    def test_query_count(self, django_assert_num_queries):
        """Test that the series is built with a single query."""
        with django_assert_num_queries(1):
            _build()


@pytest.mark.django_db
class TestDurationSeriesEmpty:
    """Tests for `DurationSeries` without matching visits."""

    def test_empty_buckets(self):
        """Test that every bucket is present with zero visits and null metrics."""
        buckets, _, _ = _build()
        assert buckets == [
            {'start': f'2026-01-0{day}', 'end': f'2026-01-0{day}', **EMPTY} for day in (1, 2, 3)
        ]

    def test_empty_totals(self):
        """Test that totals are zero visits and null metrics."""
        _, totals, _ = _build()
        assert totals == EMPTY

    def test_empty_histogram(self):
        """Test that the histogram keeps its eight bins, all at zero."""
        _, _, histogram = _build()
        assert _bin_counts(histogram) == [0] * 8


@pytest.mark.django_db
class TestDurationSeriesRounding:
    """Tests for the rounding of `DurationSeries` metrics."""

    def setup_method(self):
        """Set up an anonymous session."""
        self.session = _session()

    def test_single_hit_visits_are_included(self):
        """Test that single-hit visits are counted and included in the averages."""
        _visit(self.session, _at(1), seconds=0, hits=1)
        _visit(self.session, _at(1, 13), seconds=40, hits=1)
        _, totals, _ = _build()
        assert totals['single_hit_visits'] == 2
        assert totals['average_duration_seconds'] == 20
        assert totals['median_duration_seconds'] == 20

    def test_even_count_median_duration_is_an_int(self):
        """Test that an even-count median duration is rounded to an integer."""
        _visit(self.session, _at(1), seconds=10)
        _visit(self.session, _at(1, 13), seconds=13)
        _, totals, _ = _build()
        assert totals['median_duration_seconds'] == 12
        assert isinstance(totals['median_duration_seconds'], int)

    def test_even_count_median_hits_keeps_the_half(self):
        """Test that an even-count median of hits is not rounded."""
        _visit(self.session, _at(1), hits=1)
        _visit(self.session, _at(1, 13), hits=2)
        _, totals, _ = _build()
        assert totals['median_hits'] == 1.5

    def test_average_hits_has_one_decimal(self):
        """Test that the average hits are rounded to one decimal."""
        _visit(self.session, _at(1), hits=1)
        _visit(self.session, _at(1, 13), hits=1)
        _visit(self.session, _at(1, 14), hits=2)
        _, totals, _ = _build()
        assert totals['average_hits'] == 1.3


@pytest.mark.django_db
class TestDurationSeriesHistogram:
    """Tests for the duration histogram of `DurationSeries`."""

    def setup_method(self):
        """Set up visits on the bin boundaries."""
        session = _session()
        for hour, seconds in enumerate((0, 1, 29, 30, 3599, 3600)):
            _visit(session, _at(1, hour), seconds=seconds)

    def test_edges(self):
        """Test that the eight bins have the fixed edges and an open last bin."""
        _, _, histogram = _build()
        assert [entry['lower'] for entry in histogram] == EDGES
        assert [entry['upper'] for entry in histogram] == [*EDGES[1:], None]

    def test_half_open_boundaries(self):
        """Test that a duration on an edge falls in the bin starting at that edge."""
        _, _, histogram = _build()
        assert _bin_counts(histogram) == [1, 2, 1, 0, 0, 0, 1, 1]

    def test_counts_sum_to_visits(self):
        """Test that the histogram counts add up to the total visits."""
        _, totals, histogram = _build()
        assert sum(_bin_counts(histogram)) == totals['visits'] == 6


@pytest.mark.django_db
class TestDurationSeriesDomain:
    """Tests for the `domain` filter of `DurationSeries`."""

    def setup_method(self):
        """Set up a visit on a known domain and one without domain."""
        self.domain = DomainFactory()
        _visit(_session(domain=self.domain), _at(1), seconds=10)
        _visit(_session(), _at(2), seconds=20)

    def test_domain_id(self):
        """Test that a domain id keeps only that domain's visits."""
        buckets, totals, _ = _build(domain=self.domain.id)
        assert _values(buckets, 'visits') == [1, 0, 0]
        assert totals['average_duration_seconds'] == 10

    def test_unknown_domain(self):
        """Test that `unknown` keeps only visits whose session has no domain."""
        buckets, totals, _ = _build(domain='unknown')
        assert _values(buckets, 'visits') == [0, 1, 0]
        assert totals['average_duration_seconds'] == 20


@pytest.mark.django_db
class TestDurationSeriesRange:
    """Tests for the range boundaries of `DurationSeries`."""

    def setup_method(self):
        """Set up an anonymous session."""
        self.session = _session()

    def test_open_visit_counts_its_current_duration(self):
        """Test that a visit spanning several days counts its full duration in its start bucket."""
        _visit(self.session, _at(1), seconds=2 * 86400)
        buckets, _, _ = _build()
        assert _values(buckets, 'average_duration_seconds') == [2 * 86400, None, None]

    def test_visit_started_before_range_is_excluded(self):
        """Test that a visit started before `from` but still open in range is not counted."""
        _visit(self.session, _at(31, month=12, year=2025), seconds=2 * 86400)
        _, totals, _ = _build()
        assert totals == EMPTY

    def test_deleted_user_counts_as_anonymous(self):
        """Test that a visit whose user was deleted counts as anonymous."""
        user = UserFactory()
        _visit(_session(user=user), _at(2), seconds=5)
        user.delete()
        _, totals, _ = _build(audience='anonymous')
        assert totals['visits'] == 1


@pytest.mark.django_db
class TestDurationSeriesGranularity:
    """Tests for week and month buckets of `DurationSeries`."""

    def setup_method(self):
        """Set up an anonymous session."""
        self.session = _session()

    def test_week_buckets_are_clipped(self):
        """Test that week buckets are clipped to the range and reduce the right week."""
        _visit(self.session, _at(2), seconds=10)
        _visit(self.session, _at(5), seconds=20)
        _visit(self.session, _at(13), seconds=30)
        buckets, _, _ = _build(to_date=date(2026, 1, 13), granularity='week')
        assert [(b['start'], b['end'], b['average_duration_seconds']) for b in buckets] == [
            ('2026-01-01', '2026-01-04', 10),
            ('2026-01-05', '2026-01-11', 20),
            ('2026-01-12', '2026-01-13', 30),
        ]

    def test_month_buckets_are_clipped(self):
        """Test that month buckets are clipped to the range and reduce the right month."""
        _visit(self.session, _at(20), seconds=10)
        _visit(self.session, _at(1, month=2), seconds=20)
        _visit(self.session, _at(10, month=3), seconds=30)
        buckets, _, _ = _build(
            from_date=date(2026, 1, 15), to_date=date(2026, 3, 10), granularity='month',
        )
        assert [(b['start'], b['end'], b['average_duration_seconds']) for b in buckets] == [
            ('2026-01-15', '2026-01-31', 10),
            ('2026-02-01', '2026-02-28', 20),
            ('2026-03-01', '2026-03-10', 30),
        ]


@pytest.mark.django_db
class TestDurationSeriesDst:
    """Tests for `DurationSeries` across a DST transition."""

    def test_visit_spanning_the_change_keeps_its_utc_length(self):
        """Test that a visit across the Lisbon spring-forward keeps its real UTC duration."""
        # Lisbon jumps from 01:00 to 02:00 local at 01:00 UTC on 2026-03-29.
        _visit(_session(), datetime(2026, 3, 29, 0, 30, tzinfo=timezone.utc), seconds=3600)
        buckets, _, _ = _build(
            from_date=date(2026, 3, 29), to_date=date(2026, 3, 30), tz='Europe/Lisbon',
        )
        assert _values(buckets, 'average_duration_seconds') == [3600, None]
