"""Tests for the staff statistics overview view (GET /staff/statistics/overview.json)."""

from datetime import datetime, timedelta, timezone

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.tests.factories import PlayerFactory, SuperUserFactory, UserFactory
from statistics.models import Session, Visit

URL = '/staff/statistics/overview.json'
RANGE = {'from': '2026-01-01', 'to': '2026-01-03'}
TOTALS = {
    'visits': 4,
    'unique_visitors': 2,
    'logged_in_users': 1,
    'new_visitors': 2,
    'returning_visitors': 0,
    'average_duration_seconds': 30,
}


def _visit(session, day, seconds=0):
    """Create a visit of `session` started on 2026-01-`day` at noon UTC, lasting `seconds`."""
    started_at = datetime(2026, 1, day, 12, tzinfo=timezone.utc)
    return Visit.objects.create(
        session=session, started_at=started_at,
        last_seen_at=started_at + timedelta(seconds=seconds),
    )


@pytest.mark.django_db
class TestStaffStatisticsOverviewView:
    """Tests for the GET /staff/statistics/overview.json endpoint."""

    def setup_method(self):
        """Set up staff, superuser, DM and regular accounts, and a few visits."""
        self.staff_token = Token.objects.create(user=UserFactory(is_staff=True))
        self.superuser_token = Token.objects.create(user=SuperUserFactory())
        self.regular_token = Token.objects.create(user=UserFactory())
        dm_user = UserFactory()
        PlayerFactory(user=dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=dm_user)
        anonymous = Session.objects.create(ip='127.0.0.1')
        logged_in = Session.objects.create(ip='127.0.0.1', user=UserFactory())
        _visit(anonymous, 1)
        _visit(anonymous, 1, 60)
        _visit(logged_in, 2, 30)
        _visit(logged_in, 3, 30)

    def _get(self, client, token=None, **params):
        """Issue a GET request to the endpoint, optionally with a token and query params."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.get(URL, params, **extra)

    def test_unauthenticated_returns_401(self, client):
        """Test that an unauthenticated GET returns 401."""
        assert self._get(client).status_code == 401

    def test_non_staff_returns_403(self, client):
        """Test that a regular authenticated user gets a 403 response."""
        assert self._get(client, token=self.regular_token).status_code == 403

    def test_dm_returns_403(self, client):
        """Test that a game DM without staff rights gets a 403 response."""
        assert self._get(client, token=self.dm_token).status_code == 403

    def test_unauthenticated_with_invalid_params_returns_401(self, client):
        """Test that authentication is checked before the params are validated."""
        assert self._get(client, tz='Nowhere').status_code == 401

    def test_non_staff_with_invalid_params_returns_403(self, client):
        """Test that authorisation is checked before the params are validated."""
        response = self._get(client, token=self.regular_token, tz='Nowhere')
        assert response.status_code == 403
        assert 'tz' not in response.json()['errors']

    def test_staff_gets_200(self, client):
        """Test that staff can read the overview."""
        assert self._get(client, token=self.staff_token, **RANGE).status_code == 200

    def test_superuser_gets_200(self, client):
        """Test that a superuser can read the overview."""
        assert self._get(client, token=self.superuser_token, **RANGE).status_code == 200

    def test_invalid_params_return_400(self, client):
        """Test that every invalid param is reported at once in `errors`."""
        response = self._get(client, token=self.staff_token, tz='Nowhere', audience='bots')
        assert response.status_code == 400
        assert response.json() == {
            'errors': {'tz': ['invalid_timezone'], 'audience': ['invalid_audience']},
        }

    def test_envelope(self, client):
        """Test that the response holds exactly the filters echo and the totals."""
        response = self._get(client, token=self.staff_token, tz='UTC', **RANGE)
        assert response.json() == {
            'filters': {
                'from': '2026-01-01', 'to': '2026-01-03', 'tz': 'UTC',
                'granularity': 'day', 'requested_granularity': 'auto',
                'user': None, 'domain': None, 'audience': 'all',
            },
            'totals': TOTALS,
        }

    def test_no_buckets(self, client):
        """Test that the response has no `buckets` key."""
        body = self._get(client, token=self.staff_token, **RANGE).json()
        assert set(body) == {'filters', 'totals'}

    def test_totals_types(self, client):
        """Test that every total is a non-negative integer."""
        totals = self._get(client, token=self.staff_token, **RANGE).json()['totals']
        assert set(totals) == set(TOTALS)
        assert all(isinstance(value, int) and value >= 0 for value in totals.values())

    def test_empty_range_has_null_average(self, client):
        """Test that a range without visits returns zeros and a null average duration."""
        empty_range = {'from': '2025-01-01', 'to': '2025-01-03'}
        response = self._get(client, token=self.staff_token, **empty_range)
        assert response.json()['totals'] == {
            **{key: 0 for key in TOTALS}, 'average_duration_seconds': None,
        }

    def test_granularity_is_echoed_without_changing_totals(self, client):
        """Test that `granularity=month` is echoed in filters while totals are unchanged."""
        body = self._get(client, token=self.staff_token, granularity='month', **RANGE).json()
        assert body['filters']['granularity'] == 'month'
        assert body['filters']['requested_granularity'] == 'month'
        assert body['totals'] == TOTALS

    def test_response_includes_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._get(client, token=self.staff_token, **RANGE)
        assert response['X-Skip-Cache'] == 'true'

    def test_post_is_not_allowed(self, client):
        """Test that a POST is rejected with 405."""
        response = client.post(URL, HTTP_AUTHORIZATION=f'Token {self.staff_token.key}')
        assert response.status_code == 405

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('staff-statistics-overview')
        response = client.get(url, RANGE, HTTP_AUTHORIZATION=f'Token {self.superuser_token.key}')
        assert response.status_code == 200
