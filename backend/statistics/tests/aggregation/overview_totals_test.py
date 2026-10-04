"""Tests for `statistics.aggregation.overview_totals.OverviewTotals`."""

from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import pytest

from domains.tests.factories import DomainFactory
from games.tests.factories import UserFactory
from statistics.aggregation import OverviewTotals, StatisticsFilters
from statistics.models import Session, Visit

ZEROS = {
    'visits': 0,
    'unique_visitors': 0,
    'logged_in_users': 0,
    'new_visitors': 0,
    'returning_visitors': 0,
    'average_duration_seconds': None,
}


def _build(from_date=date(2026, 1, 1), to_date=date(2026, 1, 3), **kwargs):
    """Return the totals of an `OverviewTotals` over the given filters."""
    return OverviewTotals(StatisticsFilters(
        from_date=from_date, to_date=to_date, tz=ZoneInfo('UTC'),
        granularity='day', requested_granularity='auto', **kwargs,
    )).build()


def _at(day, hour=12, month=1, year=2026):
    """Return an aware UTC datetime."""
    return datetime(year, month, day, hour, tzinfo=timezone.utc)


def _before_range():
    """Return an aware UTC datetime before the default range."""
    return _at(20, month=12, year=2025)


def _visit(session, started_at, seconds=0):
    """Create a visit of `session` started at `started_at`, lasting `seconds`."""
    return Visit.objects.create(
        session=session, started_at=started_at,
        last_seen_at=started_at + timedelta(seconds=seconds),
    )


def _session(**kwargs):
    """Create a statistics session."""
    return Session.objects.create(ip='127.0.0.1', **kwargs)


@pytest.mark.django_db
class TestOverviewTotalsEmpty:
    """Tests for `OverviewTotals` without matching visits."""

    def test_all_zeros(self):
        """Test that an empty range yields zeros and a null average duration."""
        assert _build() == ZEROS

    def test_skips_earlier_visits_lookup(self, django_assert_num_queries):
        """Test that an empty range runs only the visit query."""
        _visit(_session(), _before_range())
        with django_assert_num_queries(1):
            _build()


@pytest.mark.django_db
class TestOverviewTotalsCounts:
    """Tests for the visit, visitor and logged-in counts of `OverviewTotals`."""

    def setup_method(self):
        """Set up mixed anonymous and logged-in visits."""
        self.user = UserFactory()
        anonymous = _session()
        _visit(anonymous, _at(1))
        _visit(anonymous, _at(2))
        _visit(_session(), _at(2))
        _visit(_session(user=self.user), _at(1))
        _visit(_session(user=self.user), _at(3))
        _visit(_session(user=UserFactory()), _at(3))

    def test_counts(self):
        """Test the visits, unique visitors and logged-in users counts."""
        totals = _build()
        assert totals['visits'] == 6
        assert totals['unique_visitors'] == 4
        assert totals['logged_in_users'] == 2

    def test_all_new_without_earlier_visits(self):
        """Test that every visitor is new when nobody visited before the range."""
        totals = _build()
        assert totals['new_visitors'] == 4
        assert totals['returning_visitors'] == 0

    def test_query_count(self, django_assert_num_queries):
        """Test that the totals use the visit query plus the two earlier-visits lookups."""
        with django_assert_num_queries(3):
            _build()

    def test_user_filter(self):
        """Test that the `user` filter keeps only that user's visits."""
        totals = _build(user_id=self.user.id)
        assert totals['visits'] == 2
        assert totals['unique_visitors'] == 1
        assert totals['logged_in_users'] == 1

    def test_unknown_user_is_all_zeros(self):
        """Test that a missing user id yields zeros."""
        assert _build(user_id=999999) == ZEROS

    def test_anonymous_audience(self):
        """Test that `audience=anonymous` counts anonymous keys only."""
        totals = _build(audience='anonymous')
        assert totals['visits'] == 3
        assert totals['unique_visitors'] == 2
        assert totals['logged_in_users'] == 0

    def test_logged_in_audience(self):
        """Test that `audience=logged_in` makes unique visitors equal logged-in users."""
        totals = _build(audience='logged_in')
        assert totals['visits'] == 3
        assert totals['unique_visitors'] == totals['logged_in_users'] == 2

    def test_user_with_anonymous_audience_is_all_zeros(self):
        """Test that `user` combined with `audience=anonymous` yields zeros."""
        assert _build(user_id=self.user.id, audience='anonymous') == ZEROS


@pytest.mark.django_db
class TestOverviewTotalsDuration:
    """Tests for `average_duration_seconds` of `OverviewTotals`."""

    def setup_method(self):
        """Set up an anonymous session."""
        self.session = _session()

    def test_average_is_rounded(self):
        """Test that the average duration is rounded to an integer."""
        _visit(self.session, _at(1), 10)
        _visit(self.session, _at(2), 11)
        _visit(self.session, _at(3), 11)
        assert _build()['average_duration_seconds'] == 11

    def test_single_hit_visit_counts_as_zero(self):
        """Test that a single-hit visit contributes a zero duration."""
        _visit(self.session, _at(1))
        _visit(self.session, _at(2), 60)
        assert _build()['average_duration_seconds'] == 30

    def test_open_visit_uses_current_last_seen_at(self):
        """Test that a visit still open uses its current `last_seen_at`, even past the range."""
        _visit(self.session, _at(3), 2 * 86400)
        assert _build()['average_duration_seconds'] == 2 * 86400

    def test_whole_seconds(self):
        """Test that durations are truncated to whole seconds before averaging."""
        Visit.objects.create(
            session=self.session, started_at=_at(1),
            last_seen_at=_at(1) + timedelta(seconds=5, milliseconds=900),
        )
        assert _build()['average_duration_seconds'] == 5


@pytest.mark.django_db
class TestOverviewTotalsReturning:
    """Tests for the new / returning split of `OverviewTotals`."""

    def setup_method(self):
        """Set up returning and new, anonymous and logged-in visitors."""
        self.domain = DomainFactory()
        returning_session = _session()
        _visit(returning_session, _before_range())
        _visit(returning_session, _at(1))
        _visit(_session(), _at(2))
        self.user = UserFactory()
        _visit(_session(user=self.user), _before_range())
        _visit(_session(user=self.user, domain=self.domain), _at(2))
        _visit(_session(user=UserFactory()), _at(3))

    def test_new_and_returning(self):
        """Test that visitors with a visit before `from` are returning, others new."""
        totals = _build()
        assert totals['unique_visitors'] == 4
        assert totals['returning_visitors'] == 2
        assert totals['new_visitors'] == 2

    def test_new_plus_returning_is_unique(self):
        """Test that new plus returning visitors equals unique visitors."""
        totals = _build()
        assert totals['new_visitors'] + totals['returning_visitors'] == totals['unique_visitors']

    def test_earlier_visit_on_another_domain_is_returning(self):
        """Test that an earlier visit on another domain still makes the visitor returning."""
        totals = _build(domain=self.domain.id)
        assert totals['unique_visitors'] == 1
        assert totals['returning_visitors'] == 1
        assert totals['new_visitors'] == 0

    def test_anonymous_audience_only_looks_up_sessions(self):
        """Test that `audience=anonymous` counts only anonymous returning keys."""
        totals = _build(audience='anonymous')
        assert totals['unique_visitors'] == 2
        assert totals['returning_visitors'] == 1

    def test_earlier_visit_inside_range_is_not_returning(self):
        """Test that a second visit inside the range does not make the visitor returning."""
        session = _session()
        _visit(session, _at(1))
        _visit(session, _at(2))
        totals = _build(audience='anonymous')
        assert totals['unique_visitors'] == 3
        assert totals['returning_visitors'] == 1


@pytest.mark.django_db
class TestOverviewTotalsIdentity:
    """Tests for the visitor identity and range boundaries of `OverviewTotals`."""

    def test_anonymous_then_logged_in_are_two_keys(self):
        """Test that an anonymous session and the later logged-in user are two visitors."""
        user = UserFactory()
        _visit(_session(), _at(1))
        _visit(_session(user=user), _at(2))
        totals = _build()
        assert totals['unique_visitors'] == 2
        assert totals['logged_in_users'] == 1

    def test_deleted_user_counts_as_anonymous(self):
        """Test that a visit whose user was deleted counts as an anonymous key."""
        user = UserFactory()
        _visit(_session(user=user), _at(2))
        user.delete()
        totals = _build()
        assert totals['unique_visitors'] == 1
        assert totals['logged_in_users'] == 0

    def test_unknown_domain(self):
        """Test that `domain=unknown` keeps only visits whose session has no domain."""
        _visit(_session(domain=DomainFactory()), _at(1))
        _visit(_session(), _at(2))
        assert _build(domain='unknown')['visits'] == 1

    def test_visit_started_before_range_is_not_counted(self):
        """Test that a visit started before `from` and continuing into the range is excluded."""
        _visit(_session(), _at(31, 23, month=12, year=2025), 86400)
        assert _build() == ZEROS
