"""Tests for the staff crawler-summary view (GET /staff/crawler/summary.json)."""

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.tests.factories import SuperUserFactory, UserFactory
from staff.models import CrawlerDebugEmission


@pytest.mark.django_db
class TestStaffCrawlerSummaryView:
    """Tests for the GET /staff/crawler/summary.json endpoint."""

    def setup_method(self):
        """Set up staff, superuser, and regular user accounts, each with a token."""
        self.staff_user = UserFactory(is_staff=True)
        self.staff_token = Token.objects.create(user=self.staff_user)
        self.superuser = SuperUserFactory()
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = UserFactory()
        self.regular_token = Token.objects.create(user=self.regular_user)

    def _get(self, client, token=None):
        """Issue a GET request to the staff crawler-summary endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.get('/staff/crawler/summary.json', **extra)

    def _seed_mixed_emissions(self):
        """Create 2 x stl_model and 1 x collection emissions across mixed sources."""
        CrawlerDebugEmission.objects.create(source='lootstudios', type='stl_model', payload={})
        CrawlerDebugEmission.objects.create(source='titancraft', type='stl_model', payload={})
        CrawlerDebugEmission.objects.create(source='lootstudios', type='collection', payload={})

    def test_unauthenticated_returns_401(self, client):
        """Test that an unauthenticated GET returns 401."""
        response = self._get(client)
        assert response.status_code == 401

    def test_non_staff_non_superuser_returns_403(self, client):
        """Test that a regular authenticated user gets a 403 response."""
        response = self._get(client, token=self.regular_token)
        assert response.status_code == 403

    def test_staff_user_can_read_the_summary(self, client):
        """Test that a staff user can read the per-type summary."""
        self._seed_mixed_emissions()
        response = self._get(client, token=self.staff_token)
        assert response.status_code == 200
        assert response.data == {'stl_model': 2, 'collection': 1}

    def test_superuser_can_read_the_summary(self, client):
        """Test that a superuser can read the per-type summary."""
        self._seed_mixed_emissions()
        response = self._get(client, token=self.superuser_token)
        assert response.status_code == 200
        assert response.data == {'stl_model': 2, 'collection': 1}

    def test_empty_table_returns_empty_dict(self, client):
        """Test that an empty table yields an empty dict."""
        response = self._get(client, token=self.staff_token)
        assert response.status_code == 200
        assert response.data == {}

    def test_grouping_ignores_source(self, client):
        """Test that rows of one type but different sources collapse into a single count."""
        CrawlerDebugEmission.objects.create(source='lootstudios', type='stl_model', payload={})
        CrawlerDebugEmission.objects.create(source='titancraft', type='stl_model', payload={})
        response = self._get(client, token=self.staff_token)
        assert response.status_code == 200
        assert response.data == {'stl_model': 2}

    def test_response_includes_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._get(client, token=self.staff_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('staff-crawler-summary')
        response = client.get(url, HTTP_AUTHORIZATION=f'Token {self.superuser_token.key}')
        assert response.status_code == 200
