"""Tests for the staff user approve view (POST /staff/users/approve.json)."""

import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from accounts.models import UserProfile
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import SuperUserFactory, UserFactory, UserProfileFactory

STAFF_USER_APPROVE_URL = '/staff/users/approve.json'


class TestStaffUserApproveView(TokenAuthRequestMixin, TestCase):
    """Tests for the POST /staff/users/approve.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up staff, superuser, regular user, and a pending target user."""
        cls.staff_user = UserFactory(
            username='staffer', password='secret-password', is_staff=True
        )
        cls.staff_token = Token.objects.create(user=cls.staff_user)
        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.regular_user = UserFactory(username='player', password='secret-password')
        cls.regular_token = Token.objects.create(user=cls.regular_user)

        cls.target_user = UserFactory(
            username='newbie', password='secret-password', email='newbie@example.com'
        )
        UserProfileFactory(
            user=cls.target_user, display_name='Newbie', status=UserProfile.STATUS_PENDING,
        )

    def _post(self, client, user_id, token=None):
        """Issue a POST request to the approve endpoint with the given user_id."""
        return self.post(client, STAFF_USER_APPROVE_URL, {'user_id': user_id}, token=token)

    def test_unauthenticated_returns_401(self):
        """Test that an unauthenticated request returns 401."""
        response = self._post(self.client, self.target_user.id)
        assert response.status_code == 401

    def test_non_staff_non_superuser_returns_403(self):
        """Test that a regular authenticated user returns 403."""
        response = self._post(self.client, self.target_user.id, token=self.regular_token)
        assert response.status_code == 403

    def test_staff_user_can_approve(self):
        """Test that a staff user can approve a pending user."""
        response = self._post(self.client, self.target_user.id, token=self.staff_token)
        assert response.status_code == 200

    def test_superuser_can_approve(self):
        """Test that a superuser can approve a pending user."""
        response = self._post(self.client, self.target_user.id, token=self.superuser_token)
        assert response.status_code == 200

    def test_approve_sets_status_to_approved(self):
        """Test that approving persists status=approved on the user's profile."""
        self._post(self.client, self.target_user.id, token=self.superuser_token)
        self.target_user.profile.refresh_from_db()
        assert self.target_user.profile.status == UserProfile.STATUS_APPROVED

    def test_approve_returns_updated_user_row(self):
        """Test that the response body matches a /staff/users.json row shape."""
        response = self._post(self.client, self.target_user.id, token=self.superuser_token)
        data = json.loads(response.content)
        assert data == {
            'id': self.target_user.id,
            'name': 'newbie',
            'email': 'newbie@example.com',
            'status': UserProfile.STATUS_APPROVED,
            'display_name': 'Newbie',
        }

    def test_unknown_user_id_returns_404(self):
        """Test that an unknown user_id returns 404."""
        response = self._post(self.client, 999999, token=self.superuser_token)
        assert response.status_code == 404

    def test_already_approved_user_returns_422(self):
        """Test that approving an already-approved user returns 422."""
        approved_user = UserFactory(username='already', password='secret-password')
        response = self._post(self.client, approved_user.id, token=self.superuser_token)
        assert response.status_code == 422
        data = json.loads(response.content)
        assert 'errors' in data

    def test_denied_user_returns_422(self):
        """Test that approving a denied user returns 422 instead of silently approving them."""
        denied_user = UserFactory(username='banned', password='secret-password')
        UserProfileFactory(user=denied_user, status=UserProfile.STATUS_DENIED)

        response = self._post(self.client, denied_user.id, token=self.superuser_token)
        assert response.status_code == 422
        denied_user.profile.refresh_from_db()
        assert denied_user.profile.status == UserProfile.STATUS_DENIED

    def test_response_includes_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._post(self.client, self.target_user.id, token=self.superuser_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse('staff-user-approve')
        response = self.client.post(
            url,
            data=json.dumps({'user_id': self.target_user.id}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.superuser_token.key}',
        )
        assert response.status_code == 200
