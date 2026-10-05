"""Tests for `statistics.aggregation.users_ranking.UsersRanking`."""

from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import pytest

from domains.tests.factories import DomainFactory
from games.tests.factories import UserFactory
from statistics.aggregation import StatisticsFilters, UsersRanking
from statistics.models import Session, Visit


def _filters(from_date=date(2026, 1, 1), to_date=date(2026, 1, 3), **kwargs):
    """Return statistics filters over the given range."""
    return StatisticsFilters(
        from_date=from_date, to_date=to_date, tz=ZoneInfo('UTC'),
        granularity='day', requested_granularity='auto', **kwargs,
    )


def _build(sort=UsersRanking.DEFAULT_SORT, **kwargs):
    """Return the ranked rows of a `UsersRanking` over the given filters."""
    return UsersRanking(_filters(**kwargs), sort).build()


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


def _ids(rows):
    """Return the user id of every row, in order."""
    return [row['id'] for row in rows]


@pytest.mark.django_db
class TestUsersRankingMetrics:
    """Tests for the per-user metrics of `UsersRanking`."""

    def setup_method(self):
        """Set up a user with three visits, one of them single-hit."""
        self.user = UserFactory()
        session = _session(user=self.user)
        _visit(session, _at(1), seconds=100, hits=3)
        _visit(session, _at(2), seconds=0, hits=1)
        _visit(session, _at(3), seconds=51, hits=2)

    def test_row(self):
        """Test that a user's visits reduce to one row with every metric."""
        assert list(_build()) == [{
            'id': self.user.id,
            'visits': 3,
            'time_on_site_seconds': 151,
            'average_duration_seconds': 50,
            'hits': 6,
            'last_seen_at': '2026-01-03T12:00:51Z',
            'domains': [{'id': 'unknown', 'domain': None}],
        }]

    def test_average_is_an_int(self):
        """Test that the average duration is rounded to an integer."""
        assert isinstance(_build()[0]['average_duration_seconds'], int)

    def test_single_hit_visit_only(self):
        """Test that a single-hit visit gives zero time on site and zero average."""
        row = _build(from_date=date(2026, 1, 2), to_date=date(2026, 1, 2))[0]
        assert row['time_on_site_seconds'] == 0
        assert row['average_duration_seconds'] == 0

    def test_open_visit_counts_its_current_duration(self):
        """Test that a long open visit counts its current duration."""
        other = UserFactory()
        _visit(_session(user=other), _at(1), seconds=2 * 86400)
        rows = _build(sort='time_on_site')
        assert rows[0]['id'] == other.id
        assert rows[0]['time_on_site_seconds'] == 2 * 86400

    def test_query_count(self, django_assert_num_queries):
        """Test that the ranking is built with a single query."""
        with django_assert_num_queries(1):
            _build()


@pytest.mark.django_db
class TestUsersRankingDomains:
    """Tests for the `domains` of `UsersRanking` rows."""

    def setup_method(self):
        """Set up a user on several domains and devices."""
        self.user = UserFactory()
        self.zeta = DomainFactory(domain='zeta.example.com')
        self.alpha = DomainFactory(domain='alpha.example.com')
        _visit(_session(user=self.user, domain=self.zeta), _at(1), seconds=10)
        _visit(_session(user=self.user, domain=self.zeta), _at(1, 13), seconds=10)
        _visit(_session(user=self.user), _at(2), seconds=20)
        _visit(_session(user=self.user, domain=self.alpha), _at(3), seconds=30)

    def test_one_row_per_user(self):
        """Test that a user on several domains and devices gets a single row."""
        rows = _build()
        assert rows.count() == 1
        assert rows[0]['visits'] == 4

    def test_domains_order(self):
        """Test that domains are listed once, by hostname, with `unknown` last."""
        assert _build()[0]['domains'] == [
            {'id': self.alpha.id, 'domain': 'alpha.example.com'},
            {'id': self.zeta.id, 'domain': 'zeta.example.com'},
            {'id': 'unknown', 'domain': None},
        ]

    def test_domain_filter(self):
        """Test that the `domain` filter keeps only that domain's visits and domains."""
        row = _build(domain=self.zeta.id)[0]
        assert row['visits'] == 2
        assert row['domains'] == [{'id': self.zeta.id, 'domain': 'zeta.example.com'}]

    def test_unknown_domain_filter(self):
        """Test that the `unknown` domain filter keeps only sessions without a domain."""
        row = _build(domain='unknown')[0]
        assert row['visits'] == 1
        assert row['domains'] == [{'id': 'unknown', 'domain': None}]


@pytest.mark.django_db
class TestUsersRankingSelection:
    """Tests for the rows selected by `UsersRanking`."""

    def setup_method(self):
        """Set up two users and an anonymous visit."""
        self.user = UserFactory()
        self.other = UserFactory()
        _visit(_session(user=self.user), _at(1), seconds=10)
        _visit(_session(user=self.other), _at(2), seconds=10)
        _visit(_session(), _at(2), seconds=10)

    def test_anonymous_sessions_are_excluded(self):
        """Test that only logged-in users are listed."""
        assert sorted(_ids(_build())) == sorted([self.user.id, self.other.id])

    def test_anonymous_audience_is_empty(self):
        """Test that `audience=anonymous` gives an empty result."""
        assert _build(audience='anonymous').count() == 0

    def test_logged_in_audience(self):
        """Test that `audience=logged_in` gives the same rows as `all`."""
        assert list(_build(audience='logged_in')) == list(_build())

    def test_user_filter(self):
        """Test that the `user` filter gives that one row."""
        assert _ids(_build(user_id=self.user.id)) == [self.user.id]

    def test_unknown_user_is_empty(self):
        """Test that an unknown user id gives an empty result."""
        assert _build(user_id=999999).count() == 0

    def test_visit_started_before_range_is_excluded(self):
        """Test that a visit started before `from` is not counted."""
        _visit(_session(user=self.user), _at(31, month=12, year=2025), seconds=2 * 86400)
        row = _build(user_id=self.user.id)[0]
        assert row['visits'] == 1
        assert row['last_seen_at'] == '2026-01-01T12:00:10Z'

    def test_deleted_user_is_not_listed(self):
        """Test that a deleted user's visits drop out of the ranking."""
        self.other.delete()
        assert _ids(_build()) == [self.user.id]


@pytest.mark.django_db
class TestUsersRankingSort:
    """Tests for the ordering of `UsersRanking`."""

    def setup_method(self):
        """Set up three users with distinct metrics and a tie on visits."""
        self.first, self.second, self.third = UserFactory(), UserFactory(), UserFactory()
        # first: 1 visit of 100s, 5 hits, last seen day 1
        _visit(_session(user=self.first), _at(1), seconds=100, hits=5)
        # second: 2 visits of 10s, 2 hits, last seen day 3
        second = _session(user=self.second)
        _visit(second, _at(2), seconds=10, hits=1)
        _visit(second, _at(3), seconds=10, hits=1)
        # third: 1 visit of 50s, 1 hit, last seen day 2
        _visit(_session(user=self.third), _at(2, 10), seconds=50, hits=1)

    def test_visits(self):
        """Test that `visits` orders descending, ties broken by id ascending."""
        assert _ids(_build('visits')) == [self.second.id, self.first.id, self.third.id]

    def test_time_on_site(self):
        """Test that `time_on_site` orders descending."""
        assert _ids(_build('time_on_site')) == [self.first.id, self.third.id, self.second.id]

    def test_average_duration(self):
        """Test that `average_duration` orders descending."""
        assert _ids(_build('average_duration')) == [self.first.id, self.third.id, self.second.id]

    def test_hits(self):
        """Test that `hits` orders descending."""
        assert _ids(_build('hits')) == [self.first.id, self.second.id, self.third.id]

    def test_last_seen(self):
        """Test that `last_seen` orders descending."""
        assert _ids(_build('last_seen')) == [self.second.id, self.third.id, self.first.id]

    def test_default_sort_is_visits(self):
        """Test that the default sort is `visits`."""
        assert UsersRanking.DEFAULT_SORT == 'visits'
        assert _ids(UsersRanking(_filters()).build())[0] == self.second.id

    def test_sort_keys(self):
        """Test that every sort key maps to a row field."""
        assert set(UsersRanking.SORT_KEYS) == {
            'visits', 'time_on_site', 'average_duration', 'hits', 'last_seen',
        }


@pytest.mark.django_db
class TestUsersRankingRows:
    """Tests for the sequence wrapper returned by `UsersRanking.build()`."""

    def setup_method(self):
        """Set up three users with one visit each."""
        self.users = [UserFactory() for _ in range(3)]
        for user in self.users:
            _visit(_session(user=user), _at(1))

    def test_count(self):
        """Test that `count()` takes no argument and returns the number of rows."""
        assert _build().count() == 3

    def test_len(self):
        """Test that `len()` returns the number of rows."""
        assert len(_build()) == 3

    def test_slicing(self):
        """Test that slicing returns the rows of that slice, in order."""
        assert _ids(_build()[1:3]) == [user.id for user in self.users[1:]]

    def test_slicing_past_the_end(self):
        """Test that a slice past the last row is empty."""
        assert _build()[5:10] == []
