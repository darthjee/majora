"""Tests for the staff statistics visitors view (GET /staff/statistics/visitors.json)."""

from datetime import datetime, timezone

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.tests.factories import PlayerFactory, SuperUserFactory, UserFactory
from statistics.models import Session, Visit

URL = '/staff/statistics/visitors.json'
RANGE = {'from': '2026-01-01', 'to': '2026-01-03'}


def _visit(session, day, hour=12):
    """Create a visit of `session` started on 2026-01-`day` at `hour` UTC."""
    started_at = datetime(2026, 1, day, hour, tzinfo=timezone.utc)
    return Visit.objects.create(session=session, started_at=started_at, last_seen_at=started_at)


@pytest.mark.django_db
class TestStaffStatisticsVisitorsView:
    """Tests for the GET /staff/statistics/visitors.json endpoint."""

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
        _visit(anonymous, 1, 18)
        _visit(logged_in, 1)
        _visit(logged_in, 3)

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
        """Test that staff can read the visitors series."""
        assert self._get(client, token=self.staff_token, **RANGE).status_code == 200

    def test_superuser_gets_200(self, client):
        """Test that a superuser can read the visitors series."""
        assert self._get(client, token=self.superuser_token, **RANGE).status_code == 200

    def test_invalid_params_return_400(self, client):
        """Test that every invalid param is reported at once in `errors`."""
        response = self._get(client, token=self.staff_token, tz='Nowhere', audience='bots')
        assert response.status_code == 400
        assert response.json() == {
            'errors': {'tz': ['invalid_timezone'], 'audience': ['invalid_audience']},
        }

    def test_envelope(self, client):
        """Test that the response echoes the filters and lists buckets and totals."""
        response = self._get(client, token=self.staff_token, tz='UTC', **RANGE)
        assert response.json() == {
            'filters': {
                'from': '2026-01-01', 'to': '2026-01-03', 'tz': 'UTC',
                'granularity': 'day', 'requested_granularity': 'auto',
                'user': None, 'domain': None, 'audience': 'all',
            },
            'buckets': [
                {'start': '2026-01-01', 'end': '2026-01-01', 'unique_visitors': 2,
                 'new_visitors': 2, 'returning_visitors': 0, 'anonymous': 1, 'logged_in': 1},
                {'start': '2026-01-02', 'end': '2026-01-02', 'unique_visitors': 0,
                 'new_visitors': 0, 'returning_visitors': 0, 'anonymous': 0, 'logged_in': 0},
                {'start': '2026-01-03', 'end': '2026-01-03', 'unique_visitors': 1,
                 'new_visitors': 0, 'returning_visitors': 1, 'anonymous': 0, 'logged_in': 1},
            ],
            'totals': {
                'unique_visitors': 2, 'new_visitors': 2, 'returning_visitors': 0,
                'anonymous': 1, 'logged_in': 1,
            },
        }

    def test_logged_in_audience_keeps_anonymous_key(self, client):
        """Test that `audience=logged_in` returns `anonymous: 0` everywhere, key included."""
        response = self._get(client, token=self.staff_token, audience='logged_in', **RANGE)
        body = response.json()
        assert [bucket['anonymous'] for bucket in body['buckets']] == [0, 0, 0]
        assert body['totals'] == {
            'unique_visitors': 1, 'new_visitors': 1, 'returning_visitors': 0,
            'anonymous': 0, 'logged_in': 1,
        }

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
        url = reverse('staff-statistics-visitors')
        response = client.get(url, RANGE, HTTP_AUTHORIZATION=f'Token {self.superuser_token.key}')
        assert response.status_code == 200
