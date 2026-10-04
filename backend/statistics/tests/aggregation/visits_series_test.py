"""Tests for `statistics.aggregation.visits_series.VisitsSeries`."""

from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

import pytest

from domains.tests.factories import DomainFactory
from games.tests.factories import UserFactory
from statistics.aggregation import StatisticsFilters, VisitsSeries
from statistics.models import Session, Visit

ZEROS = {'anonymous': 0, 'logged_in': 0, 'visits': 0}


def _build(from_date=date(2026, 1, 1), to_date=date(2026, 1, 3), tz='UTC',
           granularity='day', **kwargs):
    """Return `(buckets, totals)` of a `VisitsSeries` over the given filters."""
    return VisitsSeries(StatisticsFilters(
        from_date=from_date, to_date=to_date, tz=ZoneInfo(tz),
        granularity=granularity, requested_granularity='auto', **kwargs,
    )).build()


def _at(day, hour=12, month=1):
    """Return an aware UTC datetime in 2026."""
    return datetime(2026, month, day, hour, tzinfo=timezone.utc)


def _visit(session, started_at, last_seen_at=None):
    """Create a visit of `session` started at `started_at`."""
    return Visit.objects.create(
        session=session, started_at=started_at, last_seen_at=last_seen_at or started_at,
    )


def _session(**kwargs):
    """Create a statistics session."""
    return Session.objects.create(ip='127.0.0.1', **kwargs)


def _counts(buckets, key):
    """Return the `key` count of every bucket, in order."""
    return [bucket[key] for bucket in buckets]


@pytest.mark.django_db
class TestVisitsSeriesAudienceSplit:
    """Tests for the anonymous / logged-in split of `VisitsSeries`."""

    def setup_method(self):
        """Set up anonymous and logged-in visits over three days."""
        self.user = UserFactory()
        anonymous = _session()
        logged_in = _session(user=self.user)
        _visit(anonymous, _at(1))
        _visit(anonymous, _at(1, 13))
        _visit(logged_in, _at(1))
        _visit(logged_in, _at(3))

    def test_buckets_split_by_audience(self):
        """Test that sessions with a user count as logged-in and without as anonymous."""
        buckets, _ = _build()
        assert buckets == [
            {'start': '2026-01-01', 'end': '2026-01-01', 'anonymous': 2, 'logged_in': 1,
             'visits': 3},
            {'start': '2026-01-02', 'end': '2026-01-02', **ZEROS},
            {'start': '2026-01-03', 'end': '2026-01-03', 'anonymous': 0, 'logged_in': 1,
             'visits': 1},
        ]

    def test_visits_is_the_sum_of_both_audiences(self):
        """Test that `visits` equals `anonymous + logged_in` on every bucket and in totals."""
        buckets, totals = _build()
        for entry in [*buckets, totals]:
            assert entry['visits'] == entry['anonymous'] + entry['logged_in']

    def test_totals_are_the_bucket_sums(self):
        """Test that totals equal the per-key sums of the buckets."""
        buckets, totals = _build()
        assert totals == {key: sum(_counts(buckets, key)) for key in ZEROS}
        assert totals == {'anonymous': 2, 'logged_in': 2, 'visits': 4}

    def test_anonymous_audience_zeroes_logged_in(self):
        """Test that `audience=anonymous` keeps both keys with `logged_in` at 0."""
        buckets, totals = _build(audience='anonymous')
        assert _counts(buckets, 'logged_in') == [0, 0, 0]
        assert totals == {'anonymous': 2, 'logged_in': 0, 'visits': 2}

    def test_logged_in_audience_zeroes_anonymous(self):
        """Test that `audience=logged_in` keeps both keys with `anonymous` at 0."""
        buckets, totals = _build(audience='logged_in')
        assert _counts(buckets, 'anonymous') == [0, 0, 0]
        assert totals == {'anonymous': 0, 'logged_in': 2, 'visits': 2}

    def test_user_filter(self):
        """Test that the `user` filter keeps only that user's visits."""
        buckets, totals = _build(user_id=self.user.id)
        assert _counts(buckets, 'anonymous') == [0, 0, 0]
        assert totals == {'anonymous': 0, 'logged_in': 2, 'visits': 2}

    def test_user_with_anonymous_audience_is_all_zeros(self):
        """Test that `user` combined with `audience=anonymous` yields only zeros."""
        buckets, totals = _build(user_id=self.user.id, audience='anonymous')
        assert totals == ZEROS
        assert [bucket for bucket in buckets if bucket['visits']] == []

    def test_unknown_user_is_zero_filled(self):
        """Test that a missing user id yields zero-filled buckets."""
        buckets, totals = _build(user_id=999999)
        assert len(buckets) == 3
        assert totals == ZEROS

    def test_query_count(self, django_assert_num_queries):
        """Test that the series is built with a single query."""
        with django_assert_num_queries(1):
            _build()


@pytest.mark.django_db
class TestVisitsSeriesEmpty:
    """Tests for `VisitsSeries` without matching visits."""

    def test_zero_filled_range(self):
        """Test that every bucket is present and zero, oldest first, without visits."""
        buckets, totals = _build()
        assert buckets == [
            {'start': f'2026-01-0{day}', 'end': f'2026-01-0{day}', **ZEROS} for day in (1, 2, 3)
        ]
        assert totals == ZEROS


@pytest.mark.django_db
class TestVisitsSeriesDomain:
    """Tests for the `domain` filter of `VisitsSeries`."""

    def setup_method(self):
        """Set up a visit on a known domain and one without domain."""
        self.domain = DomainFactory()
        _visit(_session(domain=self.domain), _at(1))
        _visit(_session(user=UserFactory()), _at(2))

    def test_domain_id(self):
        """Test that a domain id keeps only that domain's visits."""
        buckets, totals = _build(domain=self.domain.id)
        assert _counts(buckets, 'anonymous') == [1, 0, 0]
        assert totals == {'anonymous': 1, 'logged_in': 0, 'visits': 1}

    def test_unknown_domain(self):
        """Test that `unknown` keeps only visits whose session has no domain."""
        buckets, totals = _build(domain='unknown')
        assert _counts(buckets, 'logged_in') == [0, 1, 0]
        assert totals == {'anonymous': 0, 'logged_in': 1, 'visits': 1}

    def test_unknown_domain_id_is_zero_filled(self):
        """Test that a missing domain id yields zero-filled buckets."""
        buckets, totals = _build(domain=999999)
        assert len(buckets) == 3
        assert totals == ZEROS


@pytest.mark.django_db
class TestVisitsSeriesRange:
    """Tests for the range boundaries of `VisitsSeries`."""

    def setup_method(self):
        """Set up an anonymous session."""
        self.session = _session()

    def test_open_visit_started_before_range_is_not_counted(self):
        """Test that a visit started before `from` but still open in range is not counted."""
        _visit(self.session, datetime(2025, 12, 31, 12, tzinfo=timezone.utc), _at(2))
        _, totals = _build()
        assert totals == ZEROS

    def test_open_visit_counts_in_its_start_bucket(self):
        """Test that a visit lasting several days counts once, in its start bucket."""
        _visit(self.session, _at(1), _at(3))
        buckets, _ = _build()
        assert _counts(buckets, 'visits') == [1, 0, 0]

    def test_start_is_inclusive(self):
        """Test that a visit started exactly at the range start is counted."""
        _visit(self.session, _at(1, 0))
        buckets, _ = _build()
        assert _counts(buckets, 'visits') == [1, 0, 0]

    def test_end_is_exclusive(self):
        """Test that a visit started exactly at the range end is not counted."""
        _visit(self.session, _at(4, 0))
        _, totals = _build()
        assert totals == ZEROS

    def test_deleted_user_counts_as_anonymous(self):
        """Test that a visit whose user was deleted counts as anonymous."""
        user = UserFactory()
        _visit(_session(user=user), _at(2))
        user.delete()
        _, totals = _build()
        assert totals == {'anonymous': 1, 'logged_in': 0, 'visits': 1}


@pytest.mark.django_db
class TestVisitsSeriesGranularity:
    """Tests for week and month buckets of `VisitsSeries`."""

    def setup_method(self):
        """Set up an anonymous session."""
        self.session = _session()

    def test_week_buckets_are_clipped(self):
        """Test that week buckets are clipped to the range and count in the right week."""
        _visit(self.session, _at(2))
        _visit(self.session, _at(5))
        _visit(self.session, _at(13))
        buckets, _ = _build(to_date=date(2026, 1, 13), granularity='week')
        assert [(b['start'], b['end'], b['visits']) for b in buckets] == [
            ('2026-01-01', '2026-01-04', 1),
            ('2026-01-05', '2026-01-11', 1),
            ('2026-01-12', '2026-01-13', 1),
        ]

    def test_month_buckets_are_clipped(self):
        """Test that month buckets are clipped to the range and count in the right month."""
        _visit(self.session, _at(20))
        _visit(self.session, _at(1, month=2))
        _visit(self.session, _at(10, month=3))
        buckets, _ = _build(
            from_date=date(2026, 1, 15), to_date=date(2026, 3, 10), granularity='month',
        )
        assert [(b['start'], b['end'], b['visits']) for b in buckets] == [
            ('2026-01-15', '2026-01-31', 1),
            ('2026-02-01', '2026-02-28', 1),
            ('2026-03-01', '2026-03-10', 1),
        ]


@pytest.mark.django_db
class TestVisitsSeriesDst:
    """Tests for `VisitsSeries` across a DST transition."""

    def test_visits_land_in_their_local_day(self):
        """Test that visits around the Lisbon spring-forward land in the right local day."""
        session = _session()
        # 2026-03-29 is a 23 h day in Lisbon: 23:30 local is 22:30 UTC, and
        # 00:30 local on 2026-03-30 is 23:30 UTC on 2026-03-29.
        _visit(session, datetime(2026, 3, 29, 22, 30, tzinfo=timezone.utc))
        _visit(session, datetime(2026, 3, 29, 23, 30, tzinfo=timezone.utc))
        _visit(session, datetime(2026, 3, 29, 23, 45, tzinfo=timezone.utc))
        buckets, _ = _build(
            from_date=date(2026, 3, 29), to_date=date(2026, 3, 30), tz='Europe/Lisbon',
        )
        assert _counts(buckets, 'visits') == [1, 2]
