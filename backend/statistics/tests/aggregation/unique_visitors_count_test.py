"""Tests for `statistics.aggregation.unique_visitors_count.UniqueVisitorsCount`."""

from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

import pytest

from games.tests.factories import UserFactory
from statistics.aggregation import StatisticsFilters, UniqueVisitorsCount
from statistics.models import Session, Visit


def _count(from_date=date(2026, 1, 1), to_date=date(2026, 1, 3), tz='UTC'):
    """Return the unique-visitors count over the given window."""
    return UniqueVisitorsCount(StatisticsFilters(
        from_date=from_date, to_date=to_date, tz=ZoneInfo(tz),
        granularity='day', requested_granularity='auto',
    )).count()


def _at(day, hour=12, minute=0):
    """Return an aware UTC datetime in January 2026."""
    return datetime(2026, 1, day, hour, minute, tzinfo=timezone.utc)


def _visit(session, started_at):
    """Create a visit of `session` started at `started_at`."""
    return Visit.objects.create(session=session, started_at=started_at, last_seen_at=started_at)


def _session(**kwargs):
    """Create a statistics session."""
    return Session.objects.create(ip='127.0.0.1', **kwargs)


@pytest.mark.django_db
class TestUniqueVisitorsCountEmpty:
    """Tests for `UniqueVisitorsCount` without matching visits."""

    def test_counts_zero(self):
        """Test that an empty window counts 0."""
        assert _count() == 0


@pytest.mark.django_db
class TestUniqueVisitorsCountVisitors:
    """Tests for the visitor identity rules of `UniqueVisitorsCount`."""

    def setup_method(self):
        """Create a logged-in user."""
        self.user = UserFactory()

    def test_user_with_several_sessions_counts_once(self):
        """Test that one user with several sessions is counted once."""
        _visit(_session(user=self.user), _at(1))
        _visit(_session(user=self.user), _at(2))
        assert _count() == 1

    def test_anonymous_sessions_count_each(self):
        """Test that each anonymous session is counted once."""
        anonymous = _session()
        _visit(anonymous, _at(1))
        _visit(anonymous, _at(2))
        _visit(_session(), _at(2))
        assert _count() == 2

    def test_mixed_visitors(self):
        """Test that logged-in and anonymous visitors are both counted."""
        _visit(_session(user=self.user), _at(1))
        _visit(_session(), _at(1))
        assert _count() == 2

    def test_user_id_equal_to_session_id_does_not_merge(self):
        """Test that a user id equal to an anonymous session id counts as two visitors."""
        session_id = self.user.id + 1000
        _visit(_session(id=session_id), _at(1))
        other_user = UserFactory(id=session_id)
        _visit(_session(user=other_user), _at(1))
        assert _count() == 2


@pytest.mark.django_db
class TestUniqueVisitorsCountWindow:
    """Tests for the `[start_utc, end_utc)` window of `UniqueVisitorsCount`."""

    def test_includes_first_and_last_instants(self):
        """Test that visits at the window's first and last instants are counted."""
        _visit(_session(), _at(1, hour=0))
        _visit(_session(), _at(3, hour=23, minute=59))
        assert _count() == 2

    def test_excludes_visits_outside_window(self):
        """Test that visits before the start or at the exclusive end are excluded."""
        _visit(_session(), datetime(2025, 12, 31, 23, 59, tzinfo=timezone.utc))
        _visit(_session(), _at(4, hour=0))
        assert _count() == 0

    def test_uses_local_day_bounds(self):
        """Test that the window follows the local days of `tz`."""
        _visit(_session(), _at(1, hour=2))
        _visit(_session(), _at(4, hour=2))
        assert _count(tz='America/Sao_Paulo') == 1

    def test_runs_one_query(self, django_assert_num_queries):
        """Test that the count is a single aggregate query."""
        _visit(_session(user=UserFactory()), _at(1))
        _visit(_session(), _at(2))
        with django_assert_num_queries(1):
            _count()
