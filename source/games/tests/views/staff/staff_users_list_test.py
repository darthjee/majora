"""Tests for the staff users list view (GET /staff/users.json)."""

import json

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.authtoken.models import Token


@pytest.mark.django_db
class TestStaffUsersListView:
    """Tests for the GET /staff/users.json endpoint."""

    def setup_method(self):
        """Set up staff, superuser, and regular user accounts."""
        self.staff_user = User.objects.create_user(
            username='staffer', password='secret-password', is_staff=True
        )
        self.staff_token = Token.objects.create(user=self.staff_user)
        self.superuser = User.objects.create_superuser(username='admin', password='secret-password')
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = User.objects.create_user(username='player', password='secret-password')
        self.regular_token = Token.objects.create(user=self.regular_user)

    def _get(self, client, token=None):
        """Issue a GET request to the staff users list endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.get('/staff/users.json', **extra)

    def test_unauthenticated_returns_401(self, client):
        """Test that an unauthenticated request returns 401."""
        response = self._get(client)
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_non_staff_non_superuser_returns_403(self, client):
        """Test that a regular authenticated user returns 403."""
        response = self._get(client, token=self.regular_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_staff_user_returns_200(self, client):
        """Test that a staff user (not superuser) can list users."""
        response = self._get(client, token=self.staff_token)
        assert response.status_code == 200

    def test_superuser_returns_200(self, client):
        """Test that a superuser can list users."""
        response = self._get(client, token=self.superuser_token)
        assert response.status_code == 200

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = self._get(client, token=self.superuser_token)
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = self._get(client, token=self.superuser_token)
        assert response['pages'] == '1'

    def test_response_includes_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._get(client, token=self.superuser_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_expected_fields(self, client):
        """Test that list items include id, name, and email fields only."""
        response = self._get(client, token=self.superuser_token)
        data = json.loads(response.content)
        entry = next(item for item in data if item['id'] == self.staff_user.id)
        assert entry['name'] == 'staffer'
        assert set(entry.keys()) == {'id', 'name', 'email'}

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('staff-users-list')
        response = client.get(url, HTTP_AUTHORIZATION=f'Token {self.superuser_token.key}')
        assert response.status_code == 200
