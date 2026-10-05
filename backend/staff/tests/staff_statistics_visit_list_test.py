"""Tests for the staff statistics visit list view (GET /staff/statistics/visit-list.json)."""

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from rest_framework.authtoken.models import Token

from domains.tests.factories import DomainFactory
from games.tests.factories import (
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
    UserProfileFactory,
)
from statistics.models import Session, Visit

URL = '/staff/statistics/visit-list.json'
RANGE = {'from': '2026-01-01', 'to': '2026-01-03', 'tz': 'UTC'}
ROW_KEYS = [
    'id', 'started_at', 'last_seen_at', 'duration_seconds', 'hits', 'ongoing',
    'ip', 'domain', 'session_id', 'user',
]
USER_KEYS = ['id', 'name', 'display_name', 'email']
VIEW_TIMEZONE = 'staff.views.staff_statistics_visit_list.timezone'


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
    return Session.objects.create(ip='10.0.0.1', **kwargs)


def _ids(response):
    """Return the visit id of every row of `response`, in order."""
    return [row['id'] for row in response.json()]


class _VisitListViewSetup:
    """Shared accounts, users and visits of the visit list view tests."""

    def setup_method(self):
        """Set up staff, superuser, DM and regular accounts, and four visits."""
        self.staff_token = Token.objects.create(user=UserFactory(is_staff=True))
        self.superuser_token = Token.objects.create(user=SuperUserFactory())
        self.regular_token = Token.objects.create(user=UserFactory())
        dm_user = UserFactory()
        PlayerFactory(user=dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=dm_user)
        self.zeta = DomainFactory(domain='zeta.example.com')
        self.alpha = DomainFactory(domain='alpha.example.com')
        self._create_visits()

    def _create_visits(self):
        """Create aria's, borin's, carol's and an anonymous visit with distinct metrics."""
        self.aria = UserFactory(username='aria', email='aria@example.com')
        UserProfileFactory(user=self.aria, display_name='Aria Stormwind')
        self.borin = UserFactory(username='borin', email='borin@example.com')
        self.carol = UserFactory(username='carol', email='carol@example.com')
        self.aria_session = Session.objects.create(
            ip='203.0.113.7', user=self.aria, domain=self.zeta,
        )
        self.v_aria = _visit(self.aria_session, _at(1), seconds=100, hits=5)
        self.v_borin = _visit(_session(user=self.borin), _at(2), seconds=10, hits=2)
        self.v_anonymous = _visit(_session(domain=self.alpha), _at(3), seconds=0, hits=1)
        self.v_carol = _visit(_session(user=self.carol), _at(2, 14), seconds=300, hits=1)

    def _get(self, client, token=None, **params):
        """Issue a GET request to the endpoint, optionally with a token and query params."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.get(URL, params, **extra)

    def _staff_get(self, client, **params):
        """Issue a staff GET request over the test range, with extra query params."""
        return self._get(client, token=self.staff_token, **{**RANGE, **params})

    def _row(self, client, visit, **params):
        """Return the response row of `visit`."""
        rows = self._staff_get(client, **params).json()
        return next(row for row in rows if row['id'] == visit.id)


@pytest.mark.django_db
class TestStaffStatisticsVisitListAccess(_VisitListViewSetup):
    """Tests for the access control of GET /staff/statistics/visit-list.json."""

    def test_unauthenticated_returns_401(self, client):
        """Test that an unauthenticated GET returns 401."""
        assert self._get(client).status_code == 401

    def test_non_staff_returns_403(self, client):
        """Test that a regular authenticated user gets a 403 response."""
        assert self._get(client, token=self.regular_token).status_code == 403

    def test_dm_returns_403(self, client):
        """Test that a game DM without staff rights gets a 403 response."""
        assert self._get(client, token=self.dm_token).status_code == 403

    def test_non_staff_with_invalid_sort_returns_403(self, client):
        """Test that authorisation is checked before `sort` is validated."""
        response = self._get(client, token=self.regular_token, sort='bogus')
        assert response.status_code == 403
        assert 'sort' not in response.json()['errors']

    def test_staff_gets_200(self, client):
        """Test that staff can read the visit list."""
        assert self._staff_get(client).status_code == 200

    def test_superuser_gets_200(self, client):
        """Test that a superuser can read the visit list."""
        response = self._get(client, token=self.superuser_token, **RANGE)
        assert response.status_code == 200

    def test_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        assert self._staff_get(client)['X-Skip-Cache'] == 'true'

    def test_url_name(self):
        """Test that `staff-statistics-visit-list` reverses to the endpoint URL."""
        assert reverse('staff-statistics-visit-list') == URL


@pytest.mark.django_db
class TestStaffStatisticsVisitListResponse(_VisitListViewSetup):
    """Tests for the rows of GET /staff/statistics/visit-list.json."""

    def test_row(self, client):
        """Test that a logged-in visit gives the full row with the user identity."""
        assert self._row(client, self.v_aria) == {
            'id': self.v_aria.id,
            'started_at': '2026-01-01T12:00:00Z',
            'last_seen_at': '2026-01-01T12:01:40Z',
            'duration_seconds': 100,
            'hits': 5,
            'ongoing': False,
            'ip': '203.0.113.7',
            'domain': {'id': self.zeta.id, 'domain': 'zeta.example.com'},
            'session_id': self.aria_session.id,
            'user': {
                'id': self.aria.id, 'name': 'aria', 'display_name': 'Aria Stormwind',
                'email': 'aria@example.com',
            },
        }

    def test_row_keys(self, client):
        """Test that the response is a plain list whose rows have exactly the spec keys."""
        rows = self._staff_get(client).json()
        assert isinstance(rows, list)
        assert [list(row) for row in rows] == [ROW_KEYS] * 4

    def test_user_keys(self, client):
        """Test that the user identity has exactly the identity keys."""
        assert list(self._row(client, self.v_borin)['user']) == USER_KEYS

    def test_blank_display_name_is_null(self, client):
        """Test that a user without a display name gives a `null` display name."""
        assert self._row(client, self.v_carol)['user']['display_name'] is None

    def test_anonymous_user_is_null(self, client):
        """Test that an anonymous visit has a `null` user."""
        assert self._row(client, self.v_anonymous)['user'] is None

    def test_deleted_user_is_null(self, client):
        """Test that a deleted user's visit has a `null` user."""
        self.borin.delete()
        assert self._row(client, self.v_borin)['user'] is None

    def test_unknown_domain_entry(self, client):
        """Test that a session without a domain gives the unknown domain entry."""
        assert self._row(client, self.v_borin)['domain'] == {'id': 'unknown', 'domain': None}

    def test_ongoing(self, client):
        """Test that only the visits seen inside the inactivity window are ongoing."""
        with patch(VIEW_TIMEZONE) as view_timezone:
            view_timezone.now.return_value = _at(3) + timedelta(seconds=60)
            rows = self._staff_get(client).json()
        assert {row['id']: row['ongoing'] for row in rows} == {
            self.v_anonymous.id: True, self.v_carol.id: False,
            self.v_borin.id: False, self.v_aria.id: False,
        }

    def test_token_never_appears(self, client):
        """Test that no session token appears anywhere in the response body."""
        body = self._staff_get(client).content.decode()
        assert 'token' not in body
        for token in Session.objects.values_list('token', flat=True):
            assert token not in body

    def test_query_count_is_independent_of_rows(self, client):
        """Test that the number of queries does not grow with the number of rows on a page."""
        self._staff_get(client)  # warm the per-process caches (e.g. the staff lookup)
        with CaptureQueriesContext(connection) as single:
            self._staff_get(client, per_page=1)
        with CaptureQueriesContext(connection) as full:
            self._staff_get(client, per_page=4)
        assert len(single) == len(full)


@pytest.mark.django_db
class TestStaffStatisticsVisitListPagination(_VisitListViewSetup):
    """Tests for the pagination of GET /staff/statistics/visit-list.json."""

    def test_pages_keep_the_order(self, client):
        """Test that one row per page follows the sort order, ties broken by id."""
        pages = (1, 2, 3, 4)
        ids = [_ids(self._staff_get(client, sort='hits', per_page=1, page=p))[0] for p in pages]
        assert ids == [self.v_aria.id, self.v_borin.id, self.v_carol.id, self.v_anonymous.id]

    def test_page_headers(self, client):
        """Test that the headers reflect the requested page."""
        response = self._staff_get(client, per_page=1, page=2)
        assert (response['page'], response['pages'], response['per_page'], response['total']) == (
            '2', '4', '1', '4',
        )

    def test_page_past_the_last_one(self, client):
        """Test that a page past the last one returns an empty list with headers."""
        response = self._staff_get(client, per_page=1, page=5)
        assert response.status_code == 200
        assert response.json() == []
        assert response['total'] == '4'

    def test_invalid_page_returns_400(self, client):
        """Test that a bad `page` returns 400."""
        response = self._staff_get(client, page='x')
        assert response.status_code == 400
        assert response.json() == {'errors': {'page': ['invalid_page']}}

    def test_invalid_per_page_returns_400(self, client):
        """Test that a bad `per_page` returns 400."""
        response = self._staff_get(client, per_page='0')
        assert response.status_code == 400
        assert response.json() == {'errors': {'per_page': ['invalid_per_page']}}


@pytest.mark.django_db
class TestStaffStatisticsVisitListSort(_VisitListViewSetup):
    """Tests for the `sort` param of GET /staff/statistics/visit-list.json."""

    def _sorted_ids(self, client, sort):
        """Return the row ids for `sort`."""
        return _ids(self._staff_get(client, sort=sort))

    def test_default_is_started_at(self, client):
        """Test that the default sort is `started_at` descending."""
        assert _ids(self._staff_get(client)) == self._sorted_ids(client, 'started_at')

    def test_started_at(self, client):
        """Test that `sort=started_at` orders by start descending."""
        assert self._sorted_ids(client, 'started_at') == [
            self.v_anonymous.id, self.v_carol.id, self.v_borin.id, self.v_aria.id,
        ]

    def test_last_seen(self, client):
        """Test that `sort=last_seen` orders by last hit descending."""
        assert self._sorted_ids(client, 'last_seen') == [
            self.v_anonymous.id, self.v_carol.id, self.v_borin.id, self.v_aria.id,
        ]

    def test_duration(self, client):
        """Test that `sort=duration` orders by duration descending, in the database."""
        assert self._sorted_ids(client, 'duration') == [
            self.v_carol.id, self.v_aria.id, self.v_borin.id, self.v_anonymous.id,
        ]

    def test_hits_with_tie_break(self, client):
        """Test that `sort=hits` orders by hits descending, ties broken by id descending."""
        assert self._sorted_ids(client, 'hits') == [
            self.v_aria.id, self.v_borin.id, self.v_carol.id, self.v_anonymous.id,
        ]

    def test_started_at_tie_break(self, client):
        """Test that equal starts are ordered by visit id descending."""
        tied = _visit(_session(), _at(3), seconds=5)
        assert self._sorted_ids(client, 'started_at')[:2] == [tied.id, self.v_anonymous.id]

    def test_unknown_sort_returns_400(self, client):
        """Test that an unknown `sort` returns 400 with `invalid_sort`."""
        response = self._staff_get(client, sort='bogus')
        assert response.status_code == 400
        assert response.json() == {'errors': {'sort': ['invalid_sort']}}

    def test_empty_sort_returns_400(self, client):
        """Test that an empty `sort=` returns 400 with `invalid_sort`."""
        response = self._staff_get(client, sort='')
        assert response.status_code == 400
        assert response.json() == {'errors': {'sort': ['invalid_sort']}}

    def test_sort_error_is_reported_with_shared_errors(self, client):
        """Test that a bad `sort` and a bad `tz` are reported together."""
        response = self._staff_get(client, sort='bogus', tz='Nowhere')
        assert response.status_code == 400
        assert response.json() == {
            'errors': {'tz': ['invalid_timezone'], 'sort': ['invalid_sort']},
        }


@pytest.mark.django_db
class TestStaffStatisticsVisitListFilters(_VisitListViewSetup):
    """Tests for the filters of GET /staff/statistics/visit-list.json."""

    def test_anonymous_audience(self, client):
        """Test that `audience=anonymous` returns only the anonymous visits."""
        assert _ids(self._staff_get(client, audience='anonymous')) == [self.v_anonymous.id]

    def test_anonymous_audience_includes_deleted_users(self, client):
        """Test that a deleted user's visits count as anonymous."""
        self.borin.delete()
        assert _ids(self._staff_get(client, audience='anonymous')) == [
            self.v_anonymous.id, self.v_borin.id,
        ]

    def test_logged_in_audience(self, client):
        """Test that `audience=logged_in` returns only the logged-in visits."""
        assert _ids(self._staff_get(client, audience='logged_in')) == [
            self.v_carol.id, self.v_borin.id, self.v_aria.id,
        ]

    def test_all_audience(self, client):
        """Test that `audience=all` returns the same rows as the default."""
        response = self._staff_get(client, audience='all')
        assert response.json() == self._staff_get(client).json()

    def test_user_filter(self, client):
        """Test that `user=<id>` returns that user's visits."""
        assert _ids(self._staff_get(client, user=self.borin.id)) == [self.v_borin.id]

    def test_unknown_user_is_empty(self, client):
        """Test that an unknown user id returns an empty list."""
        assert self._staff_get(client, user=999999).json() == []

    def test_domain_filter(self, client):
        """Test that `domain=<id>` returns that domain's visits."""
        assert _ids(self._staff_get(client, domain=self.alpha.id)) == [self.v_anonymous.id]

    def test_unknown_domain_filter(self, client):
        """Test that `domain=unknown` returns the visits of sessions without a domain."""
        assert _ids(self._staff_get(client, domain='unknown')) == [
            self.v_carol.id, self.v_borin.id,
        ]

    def test_granularity_is_accepted(self, client):
        """Test that a valid `granularity` is accepted and ignored."""
        response = self._staff_get(client, granularity='week')
        assert response.status_code == 200
        assert response.json() == self._staff_get(client).json()

    def test_invalid_granularity_returns_400(self, client):
        """Test that an invalid `granularity` is still validated."""
        response = self._staff_get(client, granularity='hour')
        assert response.status_code == 400
        assert 'granularity' in response.json()['errors']


@pytest.mark.django_db
class TestStaffStatisticsVisitListEdgeCases(_VisitListViewSetup):
    """Tests for the edge cases of GET /staff/statistics/visit-list.json."""

    def test_visit_started_before_from_is_excluded(self, client):
        """Test that a visit started before `from` is excluded, even if it lasts into range."""
        _visit(_session(), _at(31, month=12, year=2025), seconds=2 * 86400)
        assert len(self._staff_get(client).json()) == 4

    def test_single_hit_visit(self, client):
        """Test that a single-hit visit lasts zero seconds."""
        row = self._row(client, self.v_anonymous)
        assert (row['hits'], row['duration_seconds']) == (1, 0)

    def test_login_is_a_visit_boundary(self, client):
        """Test that an anonymous visit followed by a login shows as two rows."""
        anonymous = _visit(_session(), _at(4, 10), seconds=60)
        logged_in = _visit(_session(user=self.aria), _at(4, 10) + timedelta(seconds=90))
        rows = self._staff_get(client, **{'from': '2026-01-04', 'to': '2026-01-04'}).json()
        assert [(row['id'], row['user'] and row['user']['id']) for row in rows] == [
            (logged_in.id, self.aria.id), (anonymous.id, None),
        ]
