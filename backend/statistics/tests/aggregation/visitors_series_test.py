"""Tests for `statistics.aggregation.visitors_series.VisitorsSeries`."""

from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import pytest

from domains.tests.factories import DomainFactory
from games.tests.factories import UserFactory
from statistics.aggregation import OverviewTotals, StatisticsFilters, VisitorsSeries
from statistics.models import Session, Visit

ZEROS = {
    'unique_visitors': 0,
    'new_visitors': 0,
    'returning_visitors': 0,
    'anonymous': 0,
    'logged_in': 0,
}


def _filters(from_date=date(2026, 1, 1), to_date=date(2026, 1, 3), tz='UTC',
             granularity='day', **kwargs):
    """Return resolved statistics filters."""
    return StatisticsFilters(
        from_date=from_date, to_date=to_date, tz=ZoneInfo(tz),
        granularity=granularity, requested_granularity='auto', **kwargs,
    )


def _build(**kwargs):
    """Return `(buckets, totals)` of a `VisitorsSeries` over the given filters."""
    return VisitorsSeries(_filters(**kwargs)).build()


def _at(day, hour=12, month=1, year=2026):
    """Return an aware UTC datetime."""
    return datetime(year, month, day, hour, tzinfo=timezone.utc)


def _before_range():
    """Return an aware UTC datetime before the default range."""
    return _at(20, month=12, year=2025)


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


def _counts_of(**counts):
    """Return a counts dict, zero for every key not given."""
    return {**ZEROS, **counts}


def _assert_invariants(buckets, totals):
    """Assert both splits add up to `unique_visitors` on every bucket and in totals."""
    for entry in [*buckets, totals]:
        unique = entry['unique_visitors']
        assert entry['new_visitors'] + entry['returning_visitors'] == unique
        assert entry['anonymous'] + entry['logged_in'] == unique


@pytest.mark.django_db
class TestVisitorsSeriesCounts:
    """Tests for the per-bucket and range-level counts of `VisitorsSeries`."""

    def setup_method(self):
        """Set up new and returning, anonymous and logged-in visitors over three days."""
        returning_session = _session()
        _visit(returning_session, _before_range())
        _visit(returning_session, _at(1))
        _visit(returning_session, _at(2))
        new_session = _session()
        _visit(new_session, _at(1))
        _visit(new_session, _at(3))
        self.user = UserFactory()
        _visit(_session(user=self.user), _at(2))
        _visit(_session(user=self.user), _at(3))
        returning_user = UserFactory()
        _visit(_session(user=returning_user), _before_range())
        _visit(_session(user=returning_user), _at(3))

    def test_buckets(self):
        """Test the zero-filled per-bucket counts, new only in the first-visit bucket."""
        buckets, _ = _build()
        assert buckets == [
            {'start': '2026-01-01', 'end': '2026-01-01', **_counts_of(
                unique_visitors=2, new_visitors=1, returning_visitors=1, anonymous=2,
            )},
            {'start': '2026-01-02', 'end': '2026-01-02', **_counts_of(
                unique_visitors=2, new_visitors=1, returning_visitors=1, anonymous=1,
                logged_in=1,
            )},
            {'start': '2026-01-03', 'end': '2026-01-03', **_counts_of(
                unique_visitors=3, returning_visitors=3, anonymous=1, logged_in=2,
            )},
        ]

    def test_totals_are_range_distinct_counts(self):
        """Test that totals count each key once, new meaning no visit before the range."""
        _, totals = _build()
        assert totals == {
            'unique_visitors': 4,
            'new_visitors': 2,
            'returning_visitors': 2,
            'anonymous': 2,
            'logged_in': 2,
        }

    def test_invariants(self):
        """Test that both splits add up to unique visitors on every bucket and in totals."""
        _assert_invariants(*_build())

    def test_invariants_with_filters(self):
        """Test the invariants under the audience filters."""
        for audience in ('anonymous', 'logged_in'):
            _assert_invariants(*_build(audience=audience))

    def test_matches_overview_totals(self):
        """Test that the totals match `OverviewTotals` on the same filters."""
        for kwargs in ({}, {'audience': 'anonymous'}, {'user_id': self.user.id}):
            _, totals = _build(**kwargs)
            overview = OverviewTotals(_filters(**kwargs)).build()
            assert totals['unique_visitors'] == overview['unique_visitors']
            assert totals['new_visitors'] == overview['new_visitors']
            assert totals['returning_visitors'] == overview['returning_visitors']
            assert totals['logged_in'] == overview['logged_in_users']

    def test_anonymous_audience_zeroes_logged_in(self):
        """Test that `audience=anonymous` keeps every key with `logged_in` at 0."""
        buckets, totals = _build(audience='anonymous')
        assert _counts(buckets, 'logged_in') == [0, 0, 0]
        assert totals == _counts_of(
            unique_visitors=2, new_visitors=1, returning_visitors=1, anonymous=2,
        )

    def test_logged_in_audience_zeroes_anonymous(self):
        """Test that `audience=logged_in` keeps every key with `anonymous` at 0."""
        buckets, totals = _build(audience='logged_in')
        assert _counts(buckets, 'anonymous') == [0, 0, 0]
        assert totals == _counts_of(
            unique_visitors=2, new_visitors=1, returning_visitors=1, logged_in=2,
        )

    def test_user_filter(self):
        """Test that the `user` filter counts that user only, new then returning."""
        buckets, totals = _build(user_id=self.user.id)
        assert _counts(buckets, 'unique_visitors') == [0, 1, 1]
        assert _counts(buckets, 'new_visitors') == [0, 1, 0]
        assert _counts(buckets, 'logged_in') == [0, 1, 1]
        assert totals == _counts_of(unique_visitors=1, new_visitors=1, logged_in=1)

    def test_user_with_anonymous_audience_is_all_zeros(self):
        """Test that `user` combined with `audience=anonymous` yields only zeros."""
        buckets, totals = _build(user_id=self.user.id, audience='anonymous')
        assert totals == ZEROS
        assert [bucket for bucket in buckets if bucket['unique_visitors']] == []

    def test_unknown_user_is_zero_filled(self):
        """Test that a missing user id yields zero-filled buckets."""
        buckets, totals = _build(user_id=999999)
        assert len(buckets) == 3
        assert totals == ZEROS

    def test_query_count(self, django_assert_num_queries):
        """Test the visit query plus the user and anonymous first-visit lookups."""
        with django_assert_num_queries(3):
            _build()

    def test_query_count_with_one_kind(self, django_assert_num_queries):
        """Test that only one first-visit lookup runs when every key is of one kind."""
        with django_assert_num_queries(2):
            _build(audience='anonymous')


@pytest.mark.django_db
class TestVisitorsSeriesEmpty:
    """Tests for `VisitorsSeries` without matching visits."""

    def test_zero_filled_range(self):
        """Test that every bucket is present and zero, oldest first, without visits."""
        buckets, totals = _build()
        assert buckets == [
            {'start': f'2026-01-0{day}', 'end': f'2026-01-0{day}', **ZEROS} for day in (1, 2, 3)
        ]
        assert totals == ZEROS

    def test_skips_first_visits_lookup(self, django_assert_num_queries):
        """Test that an empty range runs only the visit query."""
        _visit(_session(), _before_range())
        with django_assert_num_queries(1):
            _build()


@pytest.mark.django_db
class TestVisitorsSeriesDomain:
    """Tests for the `domain` filter of `VisitorsSeries`."""

    def setup_method(self):
        """Set up a user whose first visit is on another domain than the filtered one."""
        self.domain = DomainFactory()
        user = UserFactory()
        _visit(_session(user=user, domain=DomainFactory()), _at(1))
        _visit(_session(user=user, domain=self.domain), _at(2))

    def test_first_visit_on_another_domain_is_returning_in_bucket(self):
        """Test that the first-visit lookup ignores the domain filter in the buckets."""
        buckets, _ = _build(domain=self.domain.id)
        assert _counts(buckets, 'unique_visitors') == [0, 1, 0]
        assert _counts(buckets, 'returning_visitors') == [0, 1, 0]

    def test_bucket_new_visitors_add_up_to_less_than_totals(self):
        """Test that bucket new visitors can sum to less than the totals with a domain."""
        buckets, totals = _build(domain=self.domain.id)
        assert totals['new_visitors'] == 1
        assert sum(_counts(buckets, 'new_visitors')) == 0

    def test_bucket_new_visitors_add_up_without_domain(self):
        """Test that bucket new visitors sum to the totals without a domain filter."""
        buckets, totals = _build()
        assert sum(_counts(buckets, 'new_visitors')) == totals['new_visitors'] == 1


@pytest.mark.django_db
class TestVisitorsSeriesIdentity:
    """Tests for the visitor identity rules of `VisitorsSeries`."""

    def test_deleted_user_becomes_session_keys(self):
        """Test that a deleted user's sessions count as one anonymous key each."""
        user = UserFactory()
        _visit(_session(user=user), _at(1))
        _visit(_session(user=user), _at(2))
        user.delete()
        buckets, totals = _build()
        assert _counts(buckets, 'new_visitors') == [1, 1, 0]
        assert totals == _counts_of(unique_visitors=2, new_visitors=2, anonymous=2)

    def test_anonymous_then_logged_in_are_two_keys(self):
        """Test that an anonymous session and the later logged-in user are two visitors."""
        _visit(_session(), _at(1))
        _visit(_session(user=UserFactory()), _at(1, 13))
        buckets, totals = _build()
        expected = _counts_of(unique_visitors=2, new_visitors=2, anonymous=1, logged_in=1)
        assert {key: buckets[0][key] for key in ZEROS} == expected
        assert totals == expected

    def test_open_visit_before_range_is_not_counted(self):
        """Test that a visit started before `from` and still open in range is not counted."""
        _visit(_session(), _at(31, month=12, year=2025), _at(2))
        _, totals = _build()
        assert totals == ZEROS

    def test_open_visit_before_range_makes_returning(self):
        """Test that an open visit started before `from` makes the visitor returning."""
        session = _session()
        _visit(session, _at(31, month=12, year=2025), _at(2))
        _visit(session, _at(2, 13))
        buckets, totals = _build()
        assert _counts(buckets, 'returning_visitors') == [0, 1, 0]
        assert totals == _counts_of(unique_visitors=1, returning_visitors=1, anonymous=1)


@pytest.mark.django_db
class TestVisitorsSeriesGranularity:
    """Tests for week and month buckets of `VisitorsSeries`."""

    def setup_method(self):
        """Set up an anonymous session."""
        self.session = _session()

    def test_week_buckets_are_clipped(self):
        """Test that week buckets are clipped and the visitor is new only in its first week."""
        _visit(self.session, _at(2))
        _visit(self.session, _at(5))
        _visit(self.session, _at(13))
        buckets, _ = _build(to_date=date(2026, 1, 13), granularity='week')
        assert [(b['start'], b['end'], b['new_visitors'], b['returning_visitors'])
                for b in buckets] == [
            ('2026-01-01', '2026-01-04', 1, 0),
            ('2026-01-05', '2026-01-11', 0, 1),
            ('2026-01-12', '2026-01-13', 0, 1),
        ]

    def test_clipped_first_week_uses_range_start(self):
        """Test that a visit before `from` in the same week is returning in the clipped bucket."""
        _visit(self.session, _at(29, month=12, year=2025))
        _visit(self.session, _at(2))
        buckets, totals = _build(to_date=date(2026, 1, 13), granularity='week')
        assert buckets[0]['returning_visitors'] == 1
        assert totals['returning_visitors'] == 1

    def test_month_buckets_are_clipped(self):
        """Test that month buckets are clipped and count new vs returning per month."""
        _visit(self.session, _at(10))
        _visit(self.session, _at(20))
        newcomer = _session()
        _visit(newcomer, _at(1, month=2))
        _visit(newcomer, _at(10, month=3))
        buckets, _ = _build(
            from_date=date(2026, 1, 15), to_date=date(2026, 3, 10), granularity='month',
        )
        assert [(b['start'], b['end'], b['new_visitors'], b['returning_visitors'])
                for b in buckets] == [
            ('2026-01-15', '2026-01-31', 0, 1),
            ('2026-02-01', '2026-02-28', 1, 0),
            ('2026-03-01', '2026-03-10', 0, 1),
        ]


@pytest.mark.django_db
class TestVisitorsSeriesDst:
    """Tests for `VisitorsSeries` across a DST transition."""

    def test_visitors_land_in_their_local_day(self):
        """Test that visits around the Lisbon spring-forward land in the right local day."""
        # 2026-03-29 is a 23 h day in Lisbon: 23:30 local is 22:30 UTC, and
        # 00:30 local on 2026-03-30 is 23:30 UTC on 2026-03-29.
        early = _session()
        _visit(early, datetime(2026, 3, 29, 22, 30, tzinfo=timezone.utc))
        _visit(early, datetime(2026, 3, 29, 23, 30, tzinfo=timezone.utc))
        late = _session()
        _visit(late, datetime(2026, 3, 29, 23, 45, tzinfo=timezone.utc))
        buckets, totals = _build(
            from_date=date(2026, 3, 29), to_date=date(2026, 3, 30), tz='Europe/Lisbon',
        )
        assert _counts(buckets, 'unique_visitors') == [1, 2]
        assert _counts(buckets, 'new_visitors') == [1, 1]
        assert _counts(buckets, 'returning_visitors') == [0, 1]
        assert totals['new_visitors'] == 2

    def test_first_visit_just_before_local_range_start(self):
        """Test that a visit just before local midnight of `from` makes the visitor returning."""
        session = _session()
        local_start = datetime(2026, 3, 30, tzinfo=ZoneInfo('Europe/Lisbon'))
        _visit(session, local_start - timedelta(minutes=1))
        _visit(session, local_start + timedelta(hours=1))
        buckets, totals = _build(
            from_date=date(2026, 3, 30), to_date=date(2026, 3, 30), tz='Europe/Lisbon',
        )
        assert _counts(buckets, 'returning_visitors') == [1]
        assert totals['returning_visitors'] == 1
