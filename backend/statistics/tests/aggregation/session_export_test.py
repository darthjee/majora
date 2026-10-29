"""Tests for `SessionExport` and `SessionExportVisits`."""

from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from domains.tests.factories import DomainFactory
from statistics.aggregation import SessionExport, SessionExportVisits, StatisticsFilters
from statistics.models import Session, Visit


def _filters(tz='UTC', **kwargs):
    """Return statistics filters over 2026-01-01..2026-01-03 in `tz`."""
    return StatisticsFilters(
        from_date=date(2026, 1, 1), to_date=date(2026, 1, 3), tz=ZoneInfo(tz),
        granularity='day', requested_granularity='auto', **kwargs,
    )


def _at(day, hour=12, month=1, year=2026):
    """Return an aware UTC datetime."""
    return datetime(year, month, day, hour, tzinfo=timezone.utc)


def _session(created_at, **kwargs):
    """Create a session backdated to `created_at`."""
    session = Session.objects.create(ip='192.0.2.1', **kwargs)
    Session.objects.filter(pk=session.pk).update(created_at=created_at)
    return session


@pytest.mark.django_db
class TestSessionExport:
    """Tests for the exported sessions queryset."""

    def setup_method(self):
        """Set up sessions inside and around the range."""
        self.domain = DomainFactory(domain='zeta.example.com')
        self.late = _session(_at(3, 23), domain=self.domain)
        self.early = _session(_at(1, 0))
        self.before = _session(_at(31, 23, month=12, year=2025))
        self.after = _session(_at(4, 0))

    def _ids(self, **kwargs):
        """Return the exported session ids for `kwargs` filters."""
        return list(SessionExport(_filters(**kwargs)).queryset().values_list('id', flat=True))

    def test_range_and_order(self):
        """Test that sessions created in `[start, end)` are listed by creation."""
        assert self._ids() == [self.early.id, self.late.id]

    def test_tz_shifts_the_range(self):
        """Test that the range boundaries follow the requested time zone."""
        assert self._ids(tz='America/Sao_Paulo') == [self.late.id, self.after.id]

    def test_ties_ordered_by_id(self):
        """Test that sessions created at the same time are ordered by id."""
        twin = _session(_at(1, 0))
        assert self._ids()[:2] == [self.early.id, twin.id]

    def test_domain_filter(self):
        """Test that a domain id keeps that domain's sessions only."""
        assert self._ids(domain=self.domain.id) == [self.late.id]

    def test_unknown_domain_filter(self):
        """Test that `unknown` keeps the sessions without a domain only."""
        assert self._ids(domain='unknown') == [self.early.id]


@pytest.mark.django_db
class TestSessionExportVisits:
    """Tests for the batched, capped visits of a page of sessions."""

    def setup_method(self):
        """Set up two sessions."""
        self.first = _session(_at(1))
        self.second = _session(_at(2))
        self.loader = SessionExportVisits(_filters())

    def _visits(self, session, count, start):
        """Create `count` one-minute-apart visits of `session` from `start`."""
        Visit.objects.bulk_create([
            Visit(session=session, started_at=start + timedelta(minutes=index))
            for index in range(count)
        ])

    def test_empty_page_runs_no_query(self):
        """Test that an empty page gives no visits without querying."""
        with CaptureQueriesContext(connection) as queries:
            assert self.loader.by_session([]) == {}
        assert len(queries) == 0

    def test_reads_one_over_the_cap(self):
        """Test that each session keeps at most cap + 1 visits, earliest first."""
        self._visits(self.first, 105, _at(1))
        visits = self.loader.by_session([self.first])[self.first.id]
        assert len(visits) == SessionExportVisits.MAX_PER_SESSION + 1
        assert visits[0].started_at == _at(1)

    def test_skips_visits_outside_the_range(self):
        """Test that visits started outside the range are left out."""
        self._visits(self.first, 1, _at(4, 0))
        self._visits(self.first, 1, _at(31, 23, month=12, year=2025))
        assert self.loader.by_session([self.first]) == {}

    def test_one_query_for_many_sessions(self):
        """Test that the visits of several sessions are read in one query."""
        self._visits(self.first, 2, _at(1))
        self._visits(self.second, 3, _at(2))
        with CaptureQueriesContext(connection) as queries:
            grouped = self.loader.by_session([self.first, self.second])
        assert len(queries) == 1
        assert {key: len(value) for key, value in grouped.items()} == {
            self.first.id: 2, self.second.id: 3,
        }
