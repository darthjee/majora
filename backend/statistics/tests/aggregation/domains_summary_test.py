"""Tests for `statistics.aggregation.domains_summary.DomainsSummary`."""

from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import pytest

from domains.tests.factories import DomainFactory, DomainGroupFactory
from games.tests.factories import UserFactory
from statistics.aggregation import (
    DomainsSummary,
    DurationSeries,
    OverviewTotals,
    StatisticsFilters,
)
from statistics.models import Session, Visit

ZEROS = {
    'visits': 0,
    'anonymous': 0,
    'logged_in': 0,
    'unique_visitors': 0,
    'average_duration_seconds': None,
    'median_duration_seconds': None,
}

UNKNOWN_ROW = {'id': 'unknown', 'domain': None, 'group': None, **ZEROS}


def _filters(from_date=date(2026, 1, 1), to_date=date(2026, 1, 3), **kwargs):
    """Return statistics filters over the given range."""
    return StatisticsFilters(
        from_date=from_date, to_date=to_date, tz=ZoneInfo('UTC'),
        granularity='day', requested_granularity='auto', **kwargs,
    )


def _build(**kwargs):
    """Return `(domains, totals)` of a `DomainsSummary` over the given filters."""
    return DomainsSummary(_filters(**kwargs)).build()


def _at(day, hour=12, month=1, year=2026):
    """Return an aware UTC datetime."""
    return datetime(year, month, day, hour, tzinfo=timezone.utc)


def _visit(session, started_at, seconds=0):
    """Create a visit of `session` started at `started_at`, lasting `seconds`."""
    return Visit.objects.create(
        session=session, started_at=started_at,
        last_seen_at=started_at + timedelta(seconds=seconds),
    )


def _session(**kwargs):
    """Create a statistics session."""
    return Session.objects.create(ip='127.0.0.1', **kwargs)


def _row(domain, **values):
    """Return the expected row of a configured domain, zero-filled except `values`."""
    return {
        'id': domain.id, 'domain': domain.domain, 'group': domain.domain_group.name,
        **ZEROS, **values,
    }


def _sum(domains, key):
    """Return the sum of `key` over the rows."""
    return sum(row[key] for row in domains)


@pytest.mark.django_db
class TestDomainsSummaryRowSelection:
    """Tests for the rows selected by the `domain` filter of `DomainsSummary`."""

    def setup_method(self):
        """Set up two configured domains without visits."""
        group = DomainGroupFactory(name='Brand')
        self.alpha = DomainFactory(domain='alpha.com', domain_group=group)
        self.beta = DomainFactory(domain='beta.com', domain_group=group)

    def test_zero_filled_rows_and_unknown_last(self):
        """Test that every domain is zero-filled, by hostname, with the unknown row last."""
        domains, totals = _build()
        assert domains == [_row(self.alpha), _row(self.beta), UNKNOWN_ROW]
        assert totals == ZEROS

    def test_group_name(self):
        """Test that `group` is the domain group name."""
        domains, _ = _build()
        assert domains[0]['group'] == 'Brand'

    def test_domain_id_keeps_that_row(self):
        """Test that an existing domain id yields that zero-filled row only."""
        domains, _ = _build(domain=self.beta.id)
        assert domains == [_row(self.beta)]

    def test_missing_domain_id_is_empty(self):
        """Test that a missing domain id yields no rows and zero totals."""
        assert _build(domain=999999) == ([], ZEROS)

    def test_unknown_keeps_only_unknown_row(self):
        """Test that `domain=unknown` yields only the unknown row."""
        domains, _ = _build(domain='unknown')
        assert domains == [UNKNOWN_ROW]

    def test_unknown_skips_domain_query(self, django_assert_num_queries):
        """Test that `domain=unknown` runs only the visit query."""
        with django_assert_num_queries(1):
            _build(domain='unknown')

    def test_query_count(self, django_assert_num_queries):
        """Test that the summary runs one visit query and one domain query."""
        _visit(_session(domain=self.alpha), _at(1))
        with django_assert_num_queries(2):
            _build()


@pytest.mark.django_db
class TestDomainsSummaryOrdering:
    """Tests for the row ordering of `DomainsSummary`."""

    def setup_method(self):
        """Set up domains with different visit counts."""
        self.alpha = DomainFactory(domain='alpha.com')
        self.beta = DomainFactory(domain='beta.com')
        self.gamma = DomainFactory(domain='gamma.com')
        self.delta = DomainFactory(domain='delta.com')
        _visit(_session(domain=self.gamma), _at(1))
        _visit(_session(domain=self.gamma), _at(2))
        _visit(_session(domain=self.beta), _at(1))
        _visit(_session(domain=self.delta), _at(1))
        for day in (1, 2, 3):
            _visit(_session(), _at(day))

    def test_visits_desc_then_domain_asc_unknown_last(self):
        """Test the order: visits descending, hostname ascending, unknown last."""
        domains, _ = _build()
        assert [row['id'] for row in domains] == [
            self.gamma.id, self.beta.id, self.delta.id, self.alpha.id, 'unknown',
        ]


@pytest.mark.django_db
class TestDomainsSummaryMetrics:
    """Tests for the per-row and total metrics of `DomainsSummary`."""

    def setup_method(self):
        """Set up a user visiting two domains plus anonymous visits."""
        self.user = UserFactory()
        self.alpha = DomainFactory(domain='alpha.com')
        self.beta = DomainFactory(domain='beta.com')
        _visit(_session(user=self.user, domain=self.alpha), _at(1), 10)
        _visit(_session(user=self.user, domain=self.beta), _at(2), 20)
        anonymous = _session(domain=self.alpha)
        _visit(anonymous, _at(1), 30)
        _visit(anonymous, _at(2), 60)
        _visit(_session(), _at(3), 100)

    def test_rows(self):
        """Test the six metrics of every row."""
        domains, _ = _build()
        assert domains == [
            _row(self.alpha, visits=3, anonymous=2, logged_in=1, unique_visitors=2,
                 average_duration_seconds=33, median_duration_seconds=30),
            _row(self.beta, visits=1, logged_in=1, unique_visitors=1,
                 average_duration_seconds=20, median_duration_seconds=20),
            {**UNKNOWN_ROW, 'visits': 1, 'anonymous': 1, 'unique_visitors': 1,
             'average_duration_seconds': 100, 'median_duration_seconds': 100},
        ]

    def test_totals_count_visitor_once(self):
        """Test that a user on two domains counts once in the totals unique visitors."""
        domains, totals = _build()
        assert _sum(domains, 'unique_visitors') == 4
        assert totals['unique_visitors'] == 3

    def test_totals_counts_equal_row_sums(self):
        """Test that the totals visit counts equal the sums over the rows."""
        domains, totals = _build()
        for key in ('visits', 'anonymous', 'logged_in'):
            assert totals[key] == _sum(domains, key)

    def test_totals_durations(self):
        """Test that the totals durations are computed over all the visits."""
        _, totals = _build()
        assert totals['average_duration_seconds'] == 44
        assert totals['median_duration_seconds'] == 30

    def test_totals_match_overview(self):
        """Test that visits, unique visitors and average duration equal the overview totals."""
        _, totals = _build()
        overview = OverviewTotals(_filters()).build()
        for key in ('visits', 'unique_visitors', 'average_duration_seconds'):
            assert totals[key] == overview[key]

    def test_totals_median_matches_duration_series(self):
        """Test that the median duration equals the duration series totals."""
        _, totals = _build()
        _, duration, _ = DurationSeries(_filters()).build()
        assert totals['median_duration_seconds'] == duration['median_duration_seconds']

    def test_anonymous_audience(self):
        """Test that `audience=anonymous` zeroes every `logged_in` count."""
        domains, totals = _build(audience='anonymous')
        assert {row['logged_in'] for row in domains} == {0}
        assert totals['visits'] == totals['anonymous'] == 3

    def test_logged_in_audience(self):
        """Test that `audience=logged_in` zeroes every `anonymous` count."""
        domains, totals = _build(audience='logged_in')
        assert {row['anonymous'] for row in domains} == {0}
        assert totals['visits'] == totals['logged_in'] == 2

    def test_user_filter(self):
        """Test that the `user` filter keeps that user's visits, with no anonymous visits."""
        domains, totals = _build(user_id=self.user.id)
        assert {row['anonymous'] for row in domains} == {0}
        assert [row['visits'] for row in domains] == [1, 1, 0]
        assert totals['unique_visitors'] == 1

    def test_user_with_anonymous_audience_is_zero(self):
        """Test that `user` combined with `audience=anonymous` yields zero-filled rows."""
        domains, totals = _build(user_id=self.user.id, audience='anonymous')
        assert {row['visits'] for row in domains} == {0}
        assert totals == ZEROS


@pytest.mark.django_db
class TestDomainsSummaryEdgeCases:
    """Tests for deleted records, short visits and the range of `DomainsSummary`."""

    def setup_method(self):
        """Set up a configured domain."""
        self.domain = DomainFactory(domain='alpha.com')

    def test_deleted_domain_lands_on_unknown(self):
        """Test that the sessions of a deleted domain count on the unknown row."""
        deleted = DomainFactory(domain='gone.com')
        _visit(_session(domain=deleted), _at(1))
        deleted_id = deleted.id
        deleted.delete()
        domains, _ = _build()
        assert [row['id'] for row in domains] == [self.domain.id, 'unknown']
        assert domains[-1]['visits'] == 1
        assert _build(domain=deleted_id) == ([], ZEROS)

    def test_deleted_user_counts_as_anonymous(self):
        """Test that a session whose user was deleted counts as anonymous."""
        user = UserFactory()
        _visit(_session(user=user, domain=self.domain), _at(1))
        user.delete()
        domains, _ = _build()
        assert domains[0]['anonymous'] == 1
        assert domains[0]['logged_in'] == 0

    def test_single_hit_and_open_visits_count_as_zero(self):
        """Test that zero-duration visits are included in the average and median."""
        session = _session(domain=self.domain)
        _visit(session, _at(1))
        _visit(session, _at(2))
        _visit(session, _at(3), 90)
        domains, _ = _build()
        assert domains[0]['average_duration_seconds'] == 30
        assert domains[0]['median_duration_seconds'] == 0

    def test_visits_before_range_excluded(self):
        """Test that visits started before `from` are not counted."""
        session = _session(domain=self.domain)
        _visit(session, _at(31, month=12, year=2025), 3600 * 24)
        _visit(session, _at(1))
        domains, totals = _build()
        assert domains[0]['visits'] == 1
        assert totals['visits'] == 1

    def test_rounding(self):
        """Test that the durations are rounded to integers."""
        session = _session(domain=self.domain)
        _visit(session, _at(1), 10)
        _visit(session, _at(2), 11)
        domains, _ = _build()
        assert domains[0]['average_duration_seconds'] == 10
        assert domains[0]['median_duration_seconds'] == 10
