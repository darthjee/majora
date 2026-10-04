"""Tests for `statistics.aggregation.visit_query.VisitQuery`."""

from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import pytest

from domains.tests.factories import DomainFactory
from games.tests.factories import UserFactory
from statistics.aggregation import StatisticsFilters, VisitQuery
from statistics.models import Session, Visit

START = datetime(2026, 1, 1, tzinfo=timezone.utc)


def _query(**kwargs):
    """Build a `VisitQuery` over 2026-01-01..2026-01-31 UTC with the given filters."""
    return VisitQuery(StatisticsFilters(
        from_date=date(2026, 1, 1), to_date=date(2026, 1, 31), tz=ZoneInfo('UTC'),
        granularity='day', requested_granularity='auto', **kwargs,
    ))


def _visit(session, started_at=START + timedelta(days=1)):
    """Create a visit of `session` started at `started_at`."""
    return Visit.objects.create(session=session, started_at=started_at, last_seen_at=started_at)


@pytest.mark.django_db
class TestVisitQueryRange:
    """Tests for the time range of `VisitQuery.queryset()`."""

    def setup_method(self):
        """Set up a session."""
        self.session = Session.objects.create(ip='127.0.0.1')

    def test_start_is_inclusive(self):
        """Test that a visit started exactly at the range start is included."""
        visit = _visit(self.session, START)
        assert list(_query().queryset()) == [visit]

    def test_end_is_exclusive(self):
        """Test that a visit started exactly at the range end is excluded."""
        _visit(self.session, datetime(2026, 2, 1, tzinfo=timezone.utc))
        assert list(_query().queryset()) == []

    def test_last_instant_is_included(self):
        """Test that a visit started just before the range end is included."""
        visit = _visit(self.session, datetime(2026, 1, 31, 23, 59, 59, tzinfo=timezone.utc))
        assert list(_query().queryset()) == [visit]

    def test_before_start_is_excluded(self):
        """Test that a visit started before the range is excluded."""
        _visit(self.session, START - timedelta(seconds=1))
        assert list(_query().queryset()) == []


@pytest.mark.django_db
class TestVisitQuerySessionFilters:
    """Tests for the user, domain and audience filters of `VisitQuery.queryset()`."""

    def setup_method(self):
        """Set up anonymous and logged-in sessions on known and unknown domains."""
        self.user = UserFactory()
        self.domain = DomainFactory()
        self.anonymous = _visit(Session.objects.create(ip='127.0.0.1'))
        self.logged_in = _visit(Session.objects.create(
            ip='127.0.0.1', user=self.user, domain=self.domain,
        ))
        self.other_user = _visit(Session.objects.create(ip='127.0.0.1', user=UserFactory()))

    def _ids(self, **kwargs):
        """Return the ids of the visits matched by the given filters."""
        return set(_query(**kwargs).queryset().values_list('id', flat=True))

    def test_no_filters_match_everything(self):
        """Test that without filters every visit in range matches."""
        expected = {self.anonymous.id, self.logged_in.id, self.other_user.id}
        assert self._ids() == expected

    def test_user_filter(self):
        """Test that `user_id` keeps only that user's visits."""
        assert self._ids(user_id=self.user.id) == {self.logged_in.id}

    def test_domain_filter(self):
        """Test that a domain id keeps only that domain's visits."""
        assert self._ids(domain=self.domain.id) == {self.logged_in.id}

    def test_unknown_domain_filter(self):
        """Test that `unknown` keeps only visits whose session has no domain."""
        assert self._ids(domain='unknown') == {self.anonymous.id, self.other_user.id}

    def test_anonymous_audience(self):
        """Test that `anonymous` keeps only sessions without a user."""
        assert self._ids(audience='anonymous') == {self.anonymous.id}

    def test_logged_in_audience(self):
        """Test that `logged_in` keeps only sessions with a user."""
        assert self._ids(audience='logged_in') == {self.logged_in.id, self.other_user.id}

    def test_user_with_anonymous_audience_is_empty(self):
        """Test that a user combined with `anonymous` matches nothing."""
        assert self._ids(user_id=self.user.id, audience='anonymous') == set()

    def test_unknown_user_id_is_empty(self):
        """Test that a well-formed but missing user id matches nothing."""
        assert self._ids(user_id=999999) == set()

    def test_unknown_domain_id_is_empty(self):
        """Test that a well-formed but missing domain id matches nothing."""
        assert self._ids(domain=999999) == set()


@pytest.mark.django_db
class TestVisitQueryRows:
    """Tests for `VisitQuery.rows()`."""

    def test_returns_only_requested_fields(self):
        """Test that rows are tuples of the requested fields."""
        session = Session.objects.create(ip='127.0.0.1')
        visit = _visit(session)
        rows = list(_query().rows('session_id', 'session__user_id', 'hits'))
        assert rows == [(session.id, None, visit.hits)]


class TestVisitQueryVisitorKey:
    """Tests for `VisitQuery.visitor_key()`."""

    def test_logged_in_visitor_is_the_user(self):
        """Test that a session with a user is keyed by the user."""
        assert VisitQuery.visitor_key(4, 9) == ('user', 4)

    def test_anonymous_visitor_is_the_session(self):
        """Test that a session without a user is keyed by the session."""
        assert VisitQuery.visitor_key(None, 9) == ('session', 9)
