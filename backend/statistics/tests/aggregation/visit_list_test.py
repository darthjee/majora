"""Tests for `statistics.aggregation.visit_list.VisitList`."""

from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import pytest

from domains.tests.factories import DomainFactory
from games.tests.factories import UserFactory
from statistics.aggregation import StatisticsFilters, VisitList
from statistics.models import Session, Visit


def _filters(from_date=date(2026, 1, 1), to_date=date(2026, 1, 3), **kwargs):
    """Return statistics filters over the given range."""
    return StatisticsFilters(
        from_date=from_date, to_date=to_date, tz=ZoneInfo('UTC'),
        granularity='day', requested_granularity='auto', **kwargs,
    )


def _queryset(sort=VisitList.DEFAULT_SORT, **kwargs):
    """Return the queryset of a `VisitList` over the given filters."""
    return VisitList(_filters(**kwargs), sort).queryset()


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


def _ids(queryset):
    """Return the id of every visit, in order."""
    return [visit.id for visit in queryset]


@pytest.mark.django_db
class TestVisitListSort:
    """Tests for the ordering of `VisitList`."""

    def setup_method(self):
        """Set up three visits with distinct metrics."""
        session = _session()
        self.first = _visit(session, _at(1), seconds=100, hits=5)
        self.second = _visit(session, _at(2), seconds=10, hits=1)
        self.third = _visit(session, _at(3), seconds=50, hits=2)

    def test_started_at(self):
        """Test that `started_at` orders descending."""
        assert _ids(_queryset('started_at')) == [self.third.id, self.second.id, self.first.id]

    def test_last_seen(self):
        """Test that `last_seen` orders descending."""
        assert _ids(_queryset('last_seen')) == [self.third.id, self.second.id, self.first.id]

    def test_duration(self):
        """Test that `duration` orders descending, computed in the database."""
        assert _ids(_queryset('duration')) == [self.first.id, self.third.id, self.second.id]

    def test_hits(self):
        """Test that `hits` orders descending."""
        assert _ids(_queryset('hits')) == [self.first.id, self.third.id, self.second.id]

    def test_default_sort_is_started_at(self):
        """Test that the default sort is `started_at`."""
        assert VisitList.DEFAULT_SORT == 'started_at'
        assert _ids(VisitList(_filters()).queryset()) == _ids(_queryset('started_at'))

    def test_sort_keys(self):
        """Test that the sort keys are the public spec keys."""
        assert set(VisitList.SORT_KEYS) == {'started_at', 'last_seen', 'duration', 'hits'}

    def test_is_sliced_in_the_database(self):
        """Test that slicing the queryset gives the rows of that page, in order."""
        assert _ids(_queryset('hits')[1:3]) == [self.third.id, self.second.id]


@pytest.mark.django_db
class TestVisitListTieBreak:
    """Tests for the visit-id-descending tie-break of `VisitList`."""

    def setup_method(self):
        """Set up a session to attach the tied visits to."""
        self.session = _session()

    def _assert_tie_broken_by_id(self, sort, older, newer):
        """Assert that the two tied visits are listed by id descending."""
        assert _ids(_queryset(sort)) == [newer.id, older.id]

    def test_started_at_tie(self):
        """Test that equal `started_at` values are ordered by id descending."""
        older = _visit(self.session, _at(1), seconds=10)
        newer = _visit(self.session, _at(1), seconds=20)
        self._assert_tie_broken_by_id('started_at', older, newer)

    def test_last_seen_tie(self):
        """Test that equal `last_seen_at` values are ordered by id descending."""
        older = _visit(self.session, _at(1, 10), seconds=7200)
        newer = _visit(self.session, _at(1, 11), seconds=3600)
        self._assert_tie_broken_by_id('last_seen', older, newer)

    def test_duration_tie(self):
        """Test that equal durations are ordered by id descending."""
        older = _visit(self.session, _at(2), seconds=30)
        newer = _visit(self.session, _at(1), seconds=30)
        self._assert_tie_broken_by_id('duration', older, newer)

    def test_hits_tie(self):
        """Test that equal hits are ordered by id descending."""
        older = _visit(self.session, _at(2), hits=3)
        newer = _visit(self.session, _at(1), hits=3)
        self._assert_tie_broken_by_id('hits', older, newer)


@pytest.mark.django_db
class TestVisitListFilters:
    """Tests for the filters applied by `VisitList`."""

    def setup_method(self):
        """Set up logged-in, anonymous and domain-bound visits."""
        self.user = UserFactory()
        self.other = UserFactory()
        self.domain = DomainFactory(domain='alpha.example.com')
        self.mine = _visit(_session(user=self.user, domain=self.domain), _at(1))
        self.theirs = _visit(_session(user=self.other), _at(2))
        self.anonymous = _visit(_session(), _at(3))

    def test_range_excludes_visit_started_before_from(self):
        """Test that a visit started before `from` is excluded, even if still open in range."""
        _visit(_session(), _at(31, month=12, year=2025), seconds=2 * 86400)
        assert _ids(_queryset()) == [self.anonymous.id, self.theirs.id, self.mine.id]

    def test_open_visit_is_included(self):
        """Test that a visit still open past the range end is included."""
        open_visit = _visit(_session(), _at(3, 20), seconds=2 * 86400)
        assert _ids(_queryset())[0] == open_visit.id

    def test_user_filter(self):
        """Test that the `user` filter keeps that user's visits."""
        assert _ids(_queryset(user_id=self.user.id)) == [self.mine.id]

    def test_domain_filter(self):
        """Test that the `domain` filter keeps that domain's visits."""
        assert _ids(_queryset(domain=self.domain.id)) == [self.mine.id]

    def test_unknown_domain_filter(self):
        """Test that the `unknown` domain filter keeps the visits without a domain."""
        assert _ids(_queryset(domain='unknown')) == [self.anonymous.id, self.theirs.id]

    def test_anonymous_audience(self):
        """Test that `audience=anonymous` keeps only the anonymous visits."""
        assert _ids(_queryset(audience='anonymous')) == [self.anonymous.id]

    def test_logged_in_audience(self):
        """Test that `audience=logged_in` keeps only the logged-in visits."""
        assert _ids(_queryset(audience='logged_in')) == [self.theirs.id, self.mine.id]

    def test_deleted_user_counts_as_anonymous(self):
        """Test that a deleted user's visits are anonymous."""
        self.other.delete()
        assert _ids(_queryset(audience='anonymous')) == [self.anonymous.id, self.theirs.id]


@pytest.mark.django_db
class TestVisitListQueries:
    """Tests for the related objects joined by `VisitList`."""

    def setup_method(self):
        """Set up logged-in and anonymous visits, with and without a domain."""
        domain = DomainFactory(domain='alpha.example.com')
        _visit(_session(user=UserFactory(), domain=domain), _at(1))
        _visit(_session(user=UserFactory()), _at(2))
        _visit(_session(), _at(3))

    def test_related_objects_need_no_extra_query(self, django_assert_num_queries):
        """Test that the session, user, profile and domain come with the single query."""
        with django_assert_num_queries(1):
            for visit in _queryset():
                user = visit.session.user
                _ = user and user.profile.display_name
                _ = visit.session.domain
