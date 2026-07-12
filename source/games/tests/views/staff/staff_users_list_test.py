"""Tests for the staff users list view (GET /staff/users.json)."""

import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import SuperUserFactory, UserFactory

STAFF_USERS_URL = '/staff/users.json'


class TestStaffUsersListView(TokenAuthRequestMixin, TestCase):
    """Tests for the GET /staff/users.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up staff, superuser, and regular user accounts."""
        cls.staff_user = UserFactory(
            username='staffer', password='secret-password', is_staff=True
        )
        cls.staff_token = Token.objects.create(user=cls.staff_user)
        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.regular_user = UserFactory(username='player', password='secret-password')
        cls.regular_token = Token.objects.create(user=cls.regular_user)

    def _get(self, client, token=None):
        """Issue a GET request to the staff users list endpoint, optionally with a token."""
        return self.get(client, STAFF_USERS_URL, token=token)

    def test_unauthenticated_returns_401(self):
        """Test that an unauthenticated request returns 401."""
        response = self._get(self.client)
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_non_staff_non_superuser_returns_403(self):
        """Test that a regular authenticated user returns 403."""
        response = self._get(self.client, token=self.regular_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_staff_user_returns_200(self):
        """Test that a staff user (not superuser) can list users."""
        response = self._get(self.client, token=self.staff_token)
        assert response.status_code == 200

    def test_superuser_returns_200(self):
        """Test that a superuser can list users."""
        response = self._get(self.client, token=self.superuser_token)
        assert response.status_code == 200

    def test_response_includes_page_header(self):
        """Test that the response includes the page header."""
        response = self._get(self.client, token=self.superuser_token)
        assert response['page'] == '1'

    def test_response_includes_pages_header(self):
        """Test that the response includes the total pages header."""
        response = self._get(self.client, token=self.superuser_token)
        assert response['pages'] == '1'

    def test_response_includes_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._get(self.client, token=self.superuser_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_expected_fields(self):
        """Test that list items include id, name, and email fields only."""
        response = self._get(self.client, token=self.superuser_token)
        data = json.loads(response.content)
        entry = next(item for item in data if item['id'] == self.staff_user.id)
        assert entry['name'] == 'staffer'
        assert set(entry.keys()) == {'id', 'name', 'email'}

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse('staff-users-list')
        response = self.client.get(url, HTTP_AUTHORIZATION=f'Token {self.superuser_token.key}')
        assert response.status_code == 200
