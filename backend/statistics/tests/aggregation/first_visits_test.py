"""Tests for `statistics.aggregation.first_visits.FirstVisits`."""

from datetime import datetime, timezone

import pytest

from domains.tests.factories import DomainFactory
from games.tests.factories import UserFactory
from statistics.aggregation.first_visits import FirstVisits
from statistics.models import Session, Visit


def _at(day, month=1, year=2026):
    """Return an aware UTC datetime at noon."""
    return datetime(year, month, day, 12, tzinfo=timezone.utc)


def _visit(session, started_at):
    """Create a visit of `session` started at `started_at`."""
    return Visit.objects.create(session=session, started_at=started_at, last_seen_at=started_at)


def _session(**kwargs):
    """Create a statistics session."""
    return Session.objects.create(ip='127.0.0.1', **kwargs)


@pytest.mark.django_db
class TestFirstVisitsUsers:
    """Tests for the user lookup of `FirstVisits`."""

    def setup_method(self):
        """Set up a user with visits on several sessions and domains."""
        self.user = UserFactory()
        _visit(_session(user=self.user, domain=DomainFactory()), _at(5))
        _visit(_session(user=self.user, domain=DomainFactory()), _at(20, month=12, year=2025))
        _visit(_session(user=self.user), _at(2))

    def test_minimum_across_sessions_and_domains(self):
        """Test that a user gets the earliest visit of every session and domain."""
        result = FirstVisits([self.user.id], []).as_dict()
        assert result == {('user', self.user.id): _at(20, month=12, year=2025)}

    def test_unknown_user_is_absent(self):
        """Test that an unknown user id is not in the result."""
        assert FirstVisits([999999], []).as_dict() == {}

    def test_one_query_with_users_only(self, django_assert_num_queries):
        """Test that only the user query runs when there are no anonymous sessions."""
        with django_assert_num_queries(1):
            FirstVisits([self.user.id], []).as_dict()


@pytest.mark.django_db
class TestFirstVisitsSessions:
    """Tests for the anonymous session lookup of `FirstVisits`."""

    def setup_method(self):
        """Set up anonymous and logged-in sessions."""
        self.anonymous = _session()
        _visit(self.anonymous, _at(3))
        _visit(self.anonymous, _at(1))
        self.logged_in = _session(user=UserFactory())
        _visit(self.logged_in, _at(1))

    def test_anonymous_session(self):
        """Test that an anonymous session gets its earliest visit."""
        result = FirstVisits([], [self.anonymous.id]).as_dict()
        assert result == {('session', self.anonymous.id): _at(1)}

    def test_logged_in_session_is_absent(self):
        """Test that a logged-in session passed as anonymous is not returned."""
        assert FirstVisits([], [self.logged_in.id]).as_dict() == {}

    def test_unknown_session_is_absent(self):
        """Test that an unknown session id is not in the result."""
        assert FirstVisits([], [999999]).as_dict() == {}

    def test_one_query_with_sessions_only(self, django_assert_num_queries):
        """Test that only the session query runs when there are no users."""
        with django_assert_num_queries(1):
            FirstVisits([], [self.anonymous.id]).as_dict()


@pytest.mark.django_db
class TestFirstVisitsInputs:
    """Tests for `FirstVisits` with empty and mixed inputs."""

    def test_no_query(self, django_assert_num_queries):
        """Test that empty inputs make no query and return an empty dict."""
        with django_assert_num_queries(0):
            assert FirstVisits([], []).as_dict() == {}

    def test_both_kinds(self):
        """Test that users and anonymous sessions are returned together."""
        user = UserFactory()
        _visit(_session(user=user), _at(2))
        anonymous = _session()
        _visit(anonymous, _at(3))
        result = FirstVisits([user.id], [anonymous.id]).as_dict()
        assert result == {('user', user.id): _at(2), ('session', anonymous.id): _at(3)}
