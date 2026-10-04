"""Tests for the staff statistics domains view (GET /staff/statistics/domains.json)."""

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from domains.models import Domain
from domains.tests.factories import DomainFactory
from games.tests.factories import PlayerFactory, SuperUserFactory, UserFactory

URL = '/staff/statistics/domains.json'


@pytest.mark.django_db
class TestStaffStatisticsDomainsView:
    """Tests for the GET /staff/statistics/domains.json endpoint."""

    def setup_method(self):
        """Set up staff, superuser, DM and regular accounts, and a few domains."""
        self.staff_token = Token.objects.create(user=UserFactory(is_staff=True))
        self.superuser_token = Token.objects.create(user=SuperUserFactory())
        self.regular_token = Token.objects.create(user=UserFactory())
        dm_user = UserFactory()
        PlayerFactory(user=dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=dm_user)
        self.zeta = DomainFactory(domain='zeta.example.com')
        self.alpha = DomainFactory(domain='alpha.example.com')
        self.mid = DomainFactory(domain='mid.example.com')

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

    def test_staff_gets_domains_ordered_by_name(self, client):
        """Test that staff get every domain as `{id, domain}`, ordered alphabetically."""
        response = self._get(client, token=self.staff_token)
        assert response.status_code == 200
        assert response.json() == [
            {'id': self.alpha.id, 'domain': 'alpha.example.com'},
            {'id': self.mid.id, 'domain': 'mid.example.com'},
            {'id': self.zeta.id, 'domain': 'zeta.example.com'},
        ]

    def test_superuser_gets_domains(self, client):
        """Test that a superuser can list the domains."""
        response = self._get(client, token=self.superuser_token)
        assert response.status_code == 200
        assert len(response.json()) == 3

    def test_empty_list_without_domains(self, client):
        """Test that an empty list is returned when there are no domains."""
        Domain.objects.all().delete()
        response = self._get(client, token=self.staff_token)
        assert response.status_code == 200
        assert response.json() == []

    def test_filter_params_are_ignored(self, client):
        """Test that statistics filter params (even invalid ones) are ignored."""
        response = self._get(client, token=self.staff_token, tz='Nowhere', domain='x')
        assert response.status_code == 200
        assert len(response.json()) == 3

    def test_response_includes_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._get(client, token=self.staff_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_post_is_not_allowed(self, client):
        """Test that a POST is rejected with 405."""
        response = client.post(URL, HTTP_AUTHORIZATION=f'Token {self.staff_token.key}')
        assert response.status_code == 405

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('staff-statistics-domains')
        response = client.get(url, HTTP_AUTHORIZATION=f'Token {self.superuser_token.key}')
        assert response.status_code == 200
