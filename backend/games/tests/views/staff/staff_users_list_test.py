"""Tests for the staff users list view (GET /staff/users.json)."""

import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from accounts.models import UserProfile
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import SuperUserFactory, UserFactory, UserProfileFactory

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
        """Test that list items include id, name, email, status, and display_name."""
        response = self._get(self.client, token=self.superuser_token)
        data = json.loads(response.content)
        entry = next(item for item in data if item['id'] == self.staff_user.id)
        assert entry['name'] == 'staffer'
        assert set(entry.keys()) == {'id', 'name', 'email', 'status', 'display_name'}

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse('staff-users-list')
        response = self.client.get(url, HTTP_AUTHORIZATION=f'Token {self.superuser_token.key}')
        assert response.status_code == 200


class TestStaffUsersListViewFilters(TokenAuthRequestMixin, TestCase):
    """Tests for the `status`/`search` query params on GET /staff/users.json."""

    @classmethod
    def setUpTestData(cls):
        """Set up a superuser plus pending, approved, and denied users to filter across."""
        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)

        cls.pending_user = UserFactory(
            username='penny', password='secret-password', email='penny@example.com'
        )
        UserProfileFactory(
            user=cls.pending_user, display_name='Penny', status=UserProfile.STATUS_PENDING,
        )

        cls.approved_user = UserFactory(
            username='annie', password='secret-password', email='annie@example.com'
        )
        UserProfileFactory(
            user=cls.approved_user, display_name='Annie', status=UserProfile.STATUS_APPROVED,
        )

        cls.denied_user = UserFactory(
            username='denny', password='secret-password', email='findme@example.com'
        )
        UserProfileFactory(
            user=cls.denied_user, display_name='Findable Name', status=UserProfile.STATUS_DENIED,
        )

    def _get(self, query_string):
        """Issue a GET request to the staff users list endpoint with the given query string."""
        url = f'{STAFF_USERS_URL}?{query_string}'
        return self.get(self.client, url, token=self.superuser_token)

    def _ids(self, response):
        """Return the set of user ids present in the JSON response body."""
        return {item['id'] for item in json.loads(response.content)}

    def test_status_filter_matches_exact_status(self):
        """Test that ?status= narrows results to users with that exact profile status."""
        response = self._get('status=pending')
        assert self._ids(response) == {self.pending_user.id}

    def test_status_filter_with_no_matches_returns_empty(self):
        """Test that ?status= with no matching users returns an empty list."""
        response = self._get(f'status={UserProfile.STATUS_DENIED}&search=annie')
        assert self._ids(response) == set()

    def test_search_filter_matches_username(self):
        """Test that ?search= matches against the username."""
        response = self._get('search=annie')
        assert self._ids(response) == {self.approved_user.id}

    def test_search_filter_matches_display_name(self):
        """Test that ?search= matches against the profile display_name."""
        response = self._get('search=Findable')
        assert self._ids(response) == {self.denied_user.id}

    def test_search_filter_matches_email(self):
        """Test that ?search= matches against the email."""
        response = self._get('search=findme@example.com')
        assert self._ids(response) == {self.denied_user.id}

    def test_search_filter_is_case_insensitive(self):
        """Test that ?search= matches regardless of case."""
        response = self._get('search=ANNIE')
        assert self._ids(response) == {self.approved_user.id}

    def test_status_and_search_filters_combine(self):
        """Test that ?status= and ?search= combine as an AND."""
        response = self._get('status=approved&search=annie')
        assert self._ids(response) == {self.approved_user.id}
