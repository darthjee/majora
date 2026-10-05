"""Tests for the staff statistics duration view (GET /staff/statistics/duration.json)."""

from datetime import datetime, timedelta, timezone

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.tests.factories import PlayerFactory, SuperUserFactory, UserFactory
from statistics.models import Session, Visit

URL = '/staff/statistics/duration.json'
RANGE = {'from': '2026-01-01', 'to': '2026-01-03'}
EMPTY = {
    'visits': 0,
    'single_hit_visits': 0,
    'average_duration_seconds': None,
    'median_duration_seconds': None,
    'average_hits': None,
    'median_hits': None,
}


def _visit(session, day, hour=12, seconds=0, hits=1):
    """Create a visit of `session` started on 2026-01-`day` at `hour` UTC."""
    started_at = datetime(2026, 1, day, hour, tzinfo=timezone.utc)
    return Visit.objects.create(
        session=session, started_at=started_at,
        last_seen_at=started_at + timedelta(seconds=seconds), hits=hits,
    )


def _bin(lower, upper, count):
    """Return the expected serialized histogram bin."""
    return {'lower': lower, 'upper': upper, 'count': count}


@pytest.mark.django_db
class TestStaffStatisticsDurationView:
    """Tests for the GET /staff/statistics/duration.json endpoint."""

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
        _visit(anonymous, 1, seconds=10, hits=1)
        _visit(logged_in, 1, 13, seconds=50, hits=3)
        _visit(logged_in, 3, seconds=100, hits=2)

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
        """Test that staff can read the duration statistics."""
        assert self._get(client, token=self.staff_token, **RANGE).status_code == 200

    def test_superuser_gets_200(self, client):
        """Test that a superuser can read the duration statistics."""
        assert self._get(client, token=self.superuser_token, **RANGE).status_code == 200

    def test_invalid_params_return_400(self, client):
        """Test that every invalid param is reported at once in `errors`."""
        response = self._get(
            client, token=self.staff_token, granularity='hour',
            **{'from': '2026-01-03', 'to': '2026-01-01'},
        )
        assert response.status_code == 400
        assert response.json() == {
            'errors': {'range': ['from_after_to'], 'granularity': ['invalid_granularity']},
        }

    def test_envelope(self, client):
        """Test that the response echoes the filters and lists buckets, totals and histogram."""
        response = self._get(client, token=self.staff_token, tz='UTC', **RANGE)
        assert response.json() == {
            'filters': {
                'from': '2026-01-01', 'to': '2026-01-03', 'tz': 'UTC',
                'granularity': 'day', 'requested_granularity': 'auto',
                'user': None, 'domain': None, 'audience': 'all',
            },
            'buckets': [
                {'start': '2026-01-01', 'end': '2026-01-01', 'visits': 2,
                 'single_hit_visits': 1, 'average_duration_seconds': 30,
                 'median_duration_seconds': 30, 'average_hits': 2.0, 'median_hits': 2.0},
                {'start': '2026-01-02', 'end': '2026-01-02', **EMPTY},
                {'start': '2026-01-03', 'end': '2026-01-03', 'visits': 1,
                 'single_hit_visits': 0, 'average_duration_seconds': 100,
                 'median_duration_seconds': 100, 'average_hits': 2.0, 'median_hits': 2},
            ],
            'totals': {
                'visits': 3, 'single_hit_visits': 1, 'average_duration_seconds': 53,
                'median_duration_seconds': 50, 'average_hits': 2.0, 'median_hits': 2,
            },
            'histogram': [
                _bin(0, 1, 0), _bin(1, 30, 1), _bin(30, 60, 1), _bin(60, 180, 1),
                _bin(180, 600, 0), _bin(600, 1800, 0), _bin(1800, 3600, 0),
                _bin(3600, None, 0),
            ],
        }

    def test_empty_range(self, client):
        """Test that a range without visits returns empty totals and a zeroed histogram."""
        response = self._get(
            client, token=self.staff_token, **{'from': '2025-01-01', 'to': '2025-01-02'},
        )
        body = response.json()
        assert body['totals'] == EMPTY
        assert [entry['count'] for entry in body['histogram']] == [0] * 8

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
        url = reverse('staff-statistics-duration')
        assert url == URL
        response = client.get(url, RANGE, HTTP_AUTHORIZATION=f'Token {self.superuser_token.key}')
        assert response.status_code == 200
