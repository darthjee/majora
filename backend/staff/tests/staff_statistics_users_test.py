"""Tests for the staff statistics users view (GET /staff/statistics/users.json)."""

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from django.db import connection
from django.db.models.query import QuerySet
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from rest_framework.authtoken.models import Token

from accounts.models import UserProfile
from domains.tests.factories import DomainFactory
from games.tests.factories import (
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
    UserProfileFactory,
)
from statistics.models import Session, Visit

URL = '/staff/statistics/users.json'
RANGE = {'from': '2026-01-01', 'to': '2026-01-03', 'tz': 'UTC'}
ROW_KEYS = [
    'id', 'name', 'display_name', 'email', 'visits', 'time_on_site_seconds',
    'average_duration_seconds', 'hits', 'last_seen_at', 'domains',
]
_IN_BULK = QuerySet.in_bulk


def _visit(session, day, hour=12, seconds=0, hits=1):
    """Create a visit of `session` started on 2026-01-`day` at `hour` UTC."""
    started_at = datetime(2026, 1, day, hour, tzinfo=timezone.utc)
    return Visit.objects.create(
        session=session, started_at=started_at,
        last_seen_at=started_at + timedelta(seconds=seconds), hits=hits,
    )


def _session(**kwargs):
    """Create a statistics session."""
    return Session.objects.create(ip='127.0.0.1', **kwargs)


def _ids(response):
    """Return the user id of every row of `response`, in order."""
    return [row['id'] for row in response.json()]


class _UsersViewSetup:
    """Shared accounts, users and visits of the users view tests."""

    def setup_method(self):
        """Set up staff, superuser, DM and regular accounts, three ranked users and visits."""
        self.staff_token = Token.objects.create(user=UserFactory(is_staff=True))
        self.superuser_token = Token.objects.create(user=SuperUserFactory())
        self.regular_token = Token.objects.create(user=UserFactory())
        dm_user = UserFactory()
        PlayerFactory(user=dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=dm_user)
        self.zeta = DomainFactory(domain='zeta.example.com')
        self.alpha = DomainFactory(domain='alpha.example.com')
        self._create_ranked_users()

    def _create_ranked_users(self):
        """Create aria, borin and carol with their visits, plus an anonymous visit."""
        self.aria = UserFactory(username='aria', email='aria@example.com')
        UserProfileFactory(user=self.aria, display_name='Aria Stormwind')
        self.borin = UserFactory(username='borin', email='borin@example.com')
        self.carol = UserFactory(username='carol', email='carol@example.com')
        aria = _session(user=self.aria, domain=self.zeta)
        _visit(aria, 1, seconds=100, hits=5)
        _visit(aria, 2, seconds=20, hits=1)
        borin = _session(user=self.borin)
        _visit(borin, 1, seconds=10, hits=2)
        _visit(borin, 3, seconds=10, hits=2)
        _visit(_session(user=self.carol, domain=self.alpha), 2, 14, seconds=300, hits=1)
        _visit(_session(), 2, seconds=1000, hits=50)

    def _get(self, client, token=None, **params):
        """Issue a GET request to the endpoint, optionally with a token and query params."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.get(URL, params, **extra)

    def _staff_get(self, client, **params):
        """Issue a staff GET request over the test range, with extra query params."""
        return self._get(client, token=self.staff_token, **{**RANGE, **params})


@pytest.mark.django_db
class TestStaffStatisticsUsersAccess(_UsersViewSetup):
    """Tests for the access control of GET /staff/statistics/users.json."""

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
        """Test that staff can read the users ranking."""
        assert self._staff_get(client).status_code == 200

    def test_superuser_gets_200(self, client):
        """Test that a superuser can read the users ranking."""
        response = self._get(client, token=self.superuser_token, **RANGE)
        assert response.status_code == 200

    def test_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        assert self._staff_get(client)['X-Skip-Cache'] == 'true'

    def test_url_name(self):
        """Test that `staff-statistics-users` reverses to the endpoint URL."""
        assert reverse('staff-statistics-users') == URL


@pytest.mark.django_db
class TestStaffStatisticsUsersResponse(_UsersViewSetup):
    """Tests for the rows and headers of GET /staff/statistics/users.json."""

    def test_rows(self, client):
        """Test that the response is a plain list of rows with identities and metrics."""
        rows = self._staff_get(client).json()
        assert rows[0] == {
            'id': self.aria.id, 'name': 'aria', 'display_name': 'Aria Stormwind',
            'email': 'aria@example.com', 'visits': 2, 'time_on_site_seconds': 120,
            'average_duration_seconds': 60, 'hits': 6,
            'last_seen_at': '2026-01-02T12:00:20Z',
            'domains': [{'id': self.zeta.id, 'domain': 'zeta.example.com'}],
        }

    def test_row_keys(self, client):
        """Test that every row has exactly the spec keys, identities first."""
        rows = self._staff_get(client).json()
        assert [list(row) for row in rows] == [ROW_KEYS] * 3

    def test_unknown_domain_entry(self, client):
        """Test that sessions without a domain list the `unknown` entry."""
        rows = self._staff_get(client).json()
        assert rows[1]['domains'] == [{'id': 'unknown', 'domain': None}]

    def test_headers(self, client):
        """Test that the pagination headers are set."""
        response = self._staff_get(client)
        assert response['page'] == '1'
        assert response['pages'] == '1'
        assert response['total'] == '3'
        assert 'per_page' in response

    def test_blank_display_name_is_null(self, client):
        """Test that a profile without a display name gives `null`."""
        rows = self._staff_get(client).json()
        assert rows[1]['display_name'] is None

    def test_empty_display_name_is_null(self, client):
        """Test that an empty display name gives `null`."""
        UserProfile.objects.filter(user=self.borin).update(display_name='')
        assert self._staff_get(client).json()[1]['display_name'] is None

    def test_missing_profile_display_name_is_null(self, client):
        """Test that a user without a profile gives a `null` display name."""
        UserProfile.objects.filter(user=self.carol).delete()
        assert self._staff_get(client).json()[2]['display_name'] is None

    def test_anonymous_visits_are_not_listed(self, client):
        """Test that an anonymous-session visit never shows up as a row."""
        assert _ids(self._staff_get(client)) == [self.aria.id, self.borin.id, self.carol.id]

    def test_query_count_is_independent_of_rows(self, client):
        """Test that the number of queries does not grow with the number of users on a page."""
        self._staff_get(client)  # warm the per-process caches (e.g. the staff lookup)
        with CaptureQueriesContext(connection) as single:
            self._staff_get(client, per_page=1)
        with CaptureQueriesContext(connection) as full:
            self._staff_get(client, per_page=3)
        assert len(single) == len(full)

    def test_empty_page_skips_the_user_query(self, client):
        """Test that an empty page does not query the users."""
        self._staff_get(client)  # warm the per-process caches (e.g. the staff lookup)
        with CaptureQueriesContext(connection) as empty:
            self._staff_get(client, audience='anonymous')
        with CaptureQueriesContext(connection) as full:
            self._staff_get(client)
        assert len(empty) == len(full) - 1

    def test_user_deleted_mid_request_is_skipped(self, client):
        """Test that a user deleted between the ranking and the user lookup is skipped."""
        borin = self.borin

        def in_bulk_after_deleting_borin(queryset, *args, **kwargs):
            """Delete borin, then run the real `in_bulk`."""
            borin.delete()
            return _IN_BULK(queryset, *args, **kwargs)

        with patch.object(QuerySet, 'in_bulk', in_bulk_after_deleting_borin):
            response = self._staff_get(client)
        assert response.status_code == 200
        assert _ids(response) == [self.aria.id, self.carol.id]


@pytest.mark.django_db
class TestStaffStatisticsUsersPagination(_UsersViewSetup):
    """Tests for the pagination of GET /staff/statistics/users.json."""

    def test_pages_keep_the_order(self, client):
        """Test that one row per page follows the sort order, ties broken by id."""
        ids = [_ids(self._staff_get(client, per_page=1, page=page))[0] for page in (1, 2, 3)]
        assert ids == [self.aria.id, self.borin.id, self.carol.id]

    def test_page_headers(self, client):
        """Test that the headers reflect the requested page."""
        response = self._staff_get(client, per_page=1, page=2)
        assert (response['page'], response['pages'], response['per_page'], response['total']) == (
            '2', '3', '1', '3',
        )

    def test_page_past_the_last_one(self, client):
        """Test that a page past the last one returns an empty list with headers."""
        response = self._staff_get(client, per_page=1, page=4)
        assert response.status_code == 200
        assert response.json() == []
        assert response['total'] == '3'

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
class TestStaffStatisticsUsersSort(_UsersViewSetup):
    """Tests for the `sort` param of GET /staff/statistics/users.json."""

    def _sorted_ids(self, client, sort):
        """Return the row ids for `sort`."""
        return _ids(self._staff_get(client, sort=sort))

    def test_default_is_visits(self, client):
        """Test that the default sort is visits, ties broken by id ascending."""
        assert _ids(self._staff_get(client)) == [self.aria.id, self.borin.id, self.carol.id]

    def test_visits(self, client):
        """Test that `sort=visits` orders by visits descending."""
        assert self._sorted_ids(client, 'visits') == [self.aria.id, self.borin.id, self.carol.id]

    def test_time_on_site(self, client):
        """Test that `sort=time_on_site` orders by time on site descending."""
        assert self._sorted_ids(client, 'time_on_site') == [
            self.carol.id, self.aria.id, self.borin.id,
        ]

    def test_average_duration(self, client):
        """Test that `sort=average_duration` orders by average duration descending."""
        assert self._sorted_ids(client, 'average_duration') == [
            self.carol.id, self.aria.id, self.borin.id,
        ]

    def test_hits(self, client):
        """Test that `sort=hits` orders by hits descending."""
        assert self._sorted_ids(client, 'hits') == [self.aria.id, self.borin.id, self.carol.id]

    def test_last_seen(self, client):
        """Test that `sort=last_seen` orders by last seen descending."""
        assert self._sorted_ids(client, 'last_seen') == [
            self.borin.id, self.carol.id, self.aria.id,
        ]

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
class TestStaffStatisticsUsersFilters(_UsersViewSetup):
    """Tests for the filters of GET /staff/statistics/users.json."""

    def test_anonymous_audience_is_empty(self, client):
        """Test that `audience=anonymous` returns an empty list with a zero total."""
        response = self._staff_get(client, audience='anonymous')
        assert response.json() == []
        assert response['total'] == '0'

    def test_logged_in_audience(self, client):
        """Test that `audience=logged_in` returns the same rows as the default."""
        response = self._staff_get(client, audience='logged_in')
        assert response.json() == self._staff_get(client).json()

    def test_user_filter(self, client):
        """Test that `user=<id>` returns that one row."""
        assert _ids(self._staff_get(client, user=self.borin.id)) == [self.borin.id]

    def test_unknown_user_is_empty(self, client):
        """Test that an unknown user id returns an empty list."""
        assert self._staff_get(client, user=999999).json() == []

    def test_domain_filter(self, client):
        """Test that the `domain` filter restricts the rows and their domains."""
        rows = self._staff_get(client, domain=self.alpha.id).json()
        assert [row['id'] for row in rows] == [self.carol.id]
        assert rows[0]['domains'] == [{'id': self.alpha.id, 'domain': 'alpha.example.com'}]

    def test_unknown_domain_filter(self, client):
        """Test that `domain=unknown` keeps only sessions without a domain."""
        rows = self._staff_get(client, domain='unknown').json()
        assert [row['id'] for row in rows] == [self.borin.id]
        assert rows[0]['domains'] == [{'id': 'unknown', 'domain': None}]

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
