"""Tests for the staff cache-summary view (GET /staff/cache/summary.json)."""

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.tests.factories import SuperUserFactory, UserFactory
from majora_project.cache import memory_cache


@pytest.mark.django_db
class TestStaffCacheSummaryView:
    """Tests for the GET /staff/cache/summary.json endpoint."""

    def setup_method(self):
        """Set up staff, superuser, and regular user accounts, and prime the shared cache."""
        memory_cache.clear()
        self.staff_user = UserFactory(is_staff=True)
        self.staff_token = Token.objects.create(user=self.staff_user)
        self.superuser = SuperUserFactory()
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = UserFactory()
        self.regular_token = Token.objects.create(user=self.regular_user)
        memory_cache.set('some-type', 'some-key', 'some-value', size_bytes=10)

    def _get(self, client, token=None):
        """Issue a GET request to the staff cache-summary endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.get('/staff/cache/summary.json', **extra)

    def test_unauthenticated_returns_401(self, client):
        """Test that an unauthenticated GET returns 401."""
        response = self._get(client)
        assert response.status_code == 401

    def test_non_staff_non_superuser_returns_403(self, client):
        """Test that a regular authenticated user gets a 403 response."""
        response = self._get(client, token=self.regular_token)
        assert response.status_code == 403

    def test_staff_user_can_read_the_summary(self, client):
        """Test that a staff user can successfully read the cache summary."""
        response = self._get(client, token=self.staff_token)
        assert response.status_code == 200
        # Compared against the singleton's own summary() (rather than a hardcoded size)
        # since require_staff()'s own staff-check is itself memoized into the same
        # process-wide cache as a side effect of this very request.
        assert response.data == memory_cache.summary()

    def test_superuser_can_read_the_summary(self, client):
        """Test that a superuser can successfully read the cache summary."""
        response = self._get(client, token=self.superuser_token)
        assert response.status_code == 200
        assert response.data == memory_cache.summary()

    def test_response_includes_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._get(client, token=self.staff_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_does_not_mutate_the_cache(self, client):
        """Test that reading the summary does not clear or otherwise alter the cache."""
        self._get(client, token=self.staff_token)
        assert memory_cache.get('some-type', 'some-key') == 'some-value'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('staff-cache-summary')
        response = client.get(url, HTTP_AUTHORIZATION=f'Token {self.superuser_token.key}')
        assert response.status_code == 200
