"""Payload, filter and pagination tests for GET /staff/statistics/export.json."""

from datetime import timedelta
from unittest.mock import patch

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from accounts.tests.api_tokens.support import session_client
from domains.tests.factories import DomainFactory
from games.tests.factories import UserFactory
from majora_project.cache import memory_cache
from staff.tests.statistics_export_support import RANGE, URL, at, make_session, make_visit
from statistics.models import Visit

SESSION_KEYS = [
    'id', 'ip', 'domain', 'user_id', 'created_at', 'last_seen_at', 'visits', 'visits_truncated',
]
VISIT_KEYS = ['started_at', 'last_seen_at', 'hits']


class _ExportSetup:
    """Shared staff client, domains and sessions of the export payload tests."""

    def setup_method(self):
        """Set up a staff client, two domains and sessions in and out of the range."""
        memory_cache.clear()
        self.client = session_client(UserFactory(is_staff=True))
        self.zeta = DomainFactory(domain='zeta.example.com')
        self.alpha = DomainFactory(domain='alpha.example.com')
        self.aria = UserFactory(username='aria', email='aria@example.com')
        self.first = make_session(at(1, 10), user=self.aria, domain=self.zeta)
        self.second = make_session(at(2, 9), ip='198.51.100.4', domain=self.alpha)
        self.third = make_session(at(2, 9), ip='192.0.2.10')
        self.before = make_session(at(31, 23, month=12).replace(year=2025))
        self.after = make_session(at(4, 0))

    def _get(self, **params):
        """GET the export over the test range with extra query params."""
        return self.client.get(URL, {**RANGE, **params})

    def _ids(self, **params):
        """Return the session ids of the export page."""
        return [row['id'] for row in self._get(**params).json()]

    def _row(self, session, **params):
        """Return the export row of `session`."""
        return next(row for row in self._get(**params).json() if row['id'] == session.id)


@pytest.mark.django_db
class TestStaffStatisticsExportPayload(_ExportSetup):
    """Tests for the rows of the export."""

    def test_row(self):
        """Test that a session row carries exactly its export fields and visits."""
        make_visit(self.first, at(1, 10), seconds=100, hits=5)
        assert self._row(self.first) == {
            'id': self.first.id,
            'ip': '203.0.113.7',
            'domain': {'id': self.zeta.id, 'domain': 'zeta.example.com'},
            'user_id': self.aria.id,
            'created_at': '2026-01-01T10:00:00Z',
            'last_seen_at': '2026-01-01T11:00:00Z',
            'visits': [{
                'started_at': '2026-01-01T10:00:00Z',
                'last_seen_at': '2026-01-01T10:01:40Z',
                'hits': 5,
            }],
            'visits_truncated': False,
        }

    def test_row_keys(self):
        """Test that the response is a plain list whose rows have exactly the export keys."""
        make_visit(self.second, at(2, 9))
        rows = self._get().json()
        assert [list(row) for row in rows] == [SESSION_KEYS] * 3
        assert list(self._row(self.second)['visits'][0]) == VISIT_KEYS

    def test_unknown_domain_and_anonymous_user(self):
        """Test that a session without a domain or user gives the unknown entry and null."""
        row = self._row(self.third)
        assert row['domain'] == {'id': 'unknown', 'domain': None}
        assert row['user_id'] is None

    def test_no_token_or_user_data(self):
        """Test that no session token nor user e-mail or name appears in the body."""
        body = self._get().content.decode()
        assert self.first.token not in body
        assert 'aria@example.com' not in body
        assert '"aria"' not in body
        assert '"token"' not in body

    def test_ordering(self):
        """Test that sessions are ordered by created_at, then id, inside the range only."""
        assert self._ids() == [self.first.id, self.second.id, self.third.id]

    def test_visits_outside_range_are_skipped(self):
        """Test that only the visits started inside the range are listed."""
        make_visit(self.first, at(31, 23, month=12).replace(year=2025))
        make_visit(self.first, at(3, 23))
        make_visit(self.first, at(4, 0))
        visits = self._row(self.first)['visits']
        assert [visit['started_at'] for visit in visits] == ['2026-01-03T23:00:00Z']

    def test_visits_are_earliest_first(self):
        """Test that a session's visits are ordered by start."""
        make_visit(self.first, at(3))
        make_visit(self.first, at(1))
        visits = self._row(self.first)['visits']
        assert [visit['started_at'] for visit in visits] == [
            '2026-01-01T12:00:00Z', '2026-01-03T12:00:00Z',
        ]

    def test_visits_capped_at_100(self):
        """Test that a session with more than 100 in-range visits is cut off and flagged."""
        self._bulk_visits(self.first, 101)
        row = self._row(self.first)
        assert len(row['visits']) == 100
        assert row['visits_truncated'] is True

    def test_visits_at_cap_not_truncated(self):
        """Test that exactly 100 in-range visits are not flagged as truncated."""
        self._bulk_visits(self.first, 100)
        row = self._row(self.first)
        assert len(row['visits']) == 100
        assert row['visits_truncated'] is False

    def test_cap_is_per_session(self):
        """Test that one session's cut-off does not affect another session's visits."""
        self._bulk_visits(self.first, 101)
        make_visit(self.second, at(2, 10))
        assert len(self._row(self.second)['visits']) == 1
        assert self._row(self.second)['visits_truncated'] is False

    def test_skip_cache_header(self):
        """Test that the response carries X-Skip-Cache: true."""
        assert self._get()['X-Skip-Cache'] == 'true'

    @staticmethod
    def _bulk_visits(session, count):
        """Create `count` one-minute-apart visits of `session` on 2026-01-02."""
        Visit.objects.bulk_create([
            Visit(session=session, started_at=at(2, 0) + timedelta(minutes=index))
            for index in range(count)
        ])


@pytest.mark.django_db
class TestStaffStatisticsExportFilters(_ExportSetup):
    """Tests for the export params: domain, range, pagination."""

    def test_domain_filter(self):
        """Test that `domain` keeps the sessions of that domain only."""
        assert self._ids(domain=self.alpha.id) == [self.second.id]

    def test_unknown_domain_filter(self):
        """Test that `domain=unknown` keeps the sessions without a domain only."""
        assert self._ids(domain='unknown') == [self.third.id]

    def test_invalid_domain(self):
        """Test that a free-text domain gives 400 invalid_domain."""
        response = self._get(domain='zeta.example.com')
        assert response.status_code == 400
        assert response.json() == {'errors': {'domain': ['invalid_domain']}}

    def test_from_after_to(self):
        """Test that `from` after `to` gives 400 from_after_to."""
        response = self.client.get(URL, {'from': '2026-01-03', 'to': '2026-01-01'})
        assert response.status_code == 400
        assert response.json() == {'errors': {'range': ['from_after_to']}}

    def test_range_too_long(self):
        """Test that a range over MAJORA_STATISTICS_MAX_RANGE_DAYS gives 400."""
        with patch.dict('os.environ', {'MAJORA_STATISTICS_MAX_RANGE_DAYS': '2'}):
            response = self._get()
        assert response.status_code == 400
        assert response.json() == {'errors': {'range': ['range_too_long']}}

    def test_range_at_max(self):
        """Test that a range of exactly MAJORA_STATISTICS_MAX_RANGE_DAYS days is accepted."""
        with patch.dict('os.environ', {'MAJORA_STATISTICS_MAX_RANGE_DAYS': '3'}):
            assert self._get().status_code == 200

    def test_invalid_date(self):
        """Test that a malformed date gives 400 invalid_date."""
        response = self._get(**{'from': '2026-13-01'})
        assert response.status_code == 400
        assert response.json() == {'errors': {'from': ['invalid_date']}}

    def test_pagination(self):
        """Test that `page` / `per_page` page the sessions and set the pagination headers."""
        response = self._get(page=2, per_page=2)
        assert [row['id'] for row in response.json()] == [self.third.id]
        assert response['page'] == '2'
        assert response['pages'] == '2'
        assert response['per_page'] == '2'
        assert response['total'] == '3'

    def test_per_page_default(self):
        """Test that `per_page` defaults to MAJORA_PAGINATION_SIZE."""
        with patch.dict('os.environ', {'MAJORA_PAGINATION_SIZE': '2'}):
            response = self._get()
        assert response['per_page'] == '2'
        assert len(response.json()) == 2

    def test_per_page_at_cap(self):
        """Test that `per_page=100` is accepted."""
        assert self._get(per_page=100)['per_page'] == '100'

    def test_per_page_over_cap(self):
        """Test that `per_page` above 100 gives 400 invalid_per_page, not a clamp."""
        response = self._get(per_page=101)
        assert response.status_code == 400
        assert response.json() == {'errors': {'per_page': ['invalid_per_page']}}

    def test_invalid_params_are_reported_together(self):
        """Test that every invalid param is reported in one 400."""
        response = self._get(per_page=0, page='x', domain='nope')
        assert response.json() == {'errors': {
            'per_page': ['invalid_per_page'],
            'page': ['invalid_page'],
            'domain': ['invalid_domain'],
        }}

    def test_params_validated_before_any_query(self):
        """Test that an invalid request runs no statistics query."""
        with CaptureQueriesContext(connection) as queries:
            self._get(per_page=101)
        selects = [q['sql'] for q in queries if q['sql'].startswith('SELECT')]
        assert not [sql for sql in selects if 'statistics_' in sql]


@pytest.mark.django_db
class TestStaffStatisticsExportQueries(_ExportSetup):
    """The visits are loaded in one batch: the query count does not grow with the page."""

    def _count(self, **params):
        """Return the number of queries of one export request."""
        with CaptureQueriesContext(connection) as queries:
            assert self._get(**params).status_code == 200
        return len(queries)

    def test_query_count_independent_of_page_size(self):
        """Test that one session and three sessions with visits cost the same queries."""
        for session in (self.first, self.second, self.third):
            make_visit(session, at(2, 12))
            make_visit(session, at(3, 12))
        self._count(per_page=1)
        assert self._count(per_page=1) == self._count(per_page=3)
