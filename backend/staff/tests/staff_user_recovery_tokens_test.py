"""Tests for the staff recovery-tokens view (GET /staff/users/<id>/recovery-tokens.json)."""

import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from accounts.models import PasswordResetToken
from games.tests.factories import SuperUserFactory, UserFactory


class TestStaffUserRecoveryTokensView(TestCase):
    """Tests for the GET /staff/users/<id>/recovery-tokens.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a target user, staff, superuser, and a regular user."""
        cls.target_user = UserFactory(
            username='target', password='secret-password', email='target@example.com'
        )
        cls.staff_user = UserFactory(
            username='staffer', password='secret-password', is_staff=True
        )
        cls.staff_token = Token.objects.create(user=cls.staff_user)
        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.regular_user = UserFactory(username='player', password='secret-password')
        cls.regular_token = Token.objects.create(user=cls.regular_user)

    def _get(self, client, user_id, token=None):
        """Issue a GET request to the recovery-tokens endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.get(f'/staff/users/{user_id}/recovery-tokens.json', **extra)

    def test_unauthenticated_returns_401(self):
        """Test that an unauthenticated request returns 401."""
        response = self._get(self.client, self.target_user.id)
        assert response.status_code == 401

    def test_non_staff_non_superuser_returns_403(self):
        """Test that a regular authenticated user returns 403."""
        response = self._get(self.client, self.target_user.id, token=self.regular_token)
        assert response.status_code == 403

    def test_returns_404_for_unknown_user(self):
        """Test that 404 is returned for a non-existent user id."""
        response = self._get(self.client, 999999, token=self.superuser_token)
        assert response.status_code == 404

    def test_unauthenticated_unknown_id_returns_401_not_404(self):
        """Test that an unauthenticated request for an unknown id still returns 401."""
        response = self._get(self.client, 999999)
        assert response.status_code == 401

    def test_non_staff_unknown_id_returns_403_not_404(self):
        """Test that a non-staff request for an unknown id still returns 403."""
        response = self._get(self.client, 999999, token=self.regular_token)
        assert response.status_code == 403

    def test_response_includes_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._get(self.client, self.target_user.id, token=self.superuser_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_staff_user_can_list_tokens(self):
        """Test that a staff user can successfully list a target's tokens."""
        PasswordResetToken.objects.create(user=self.target_user, token='some-token')
        response = self._get(self.client, self.target_user.id, token=self.staff_token)
        assert response.status_code == 200

    def test_superuser_can_list_tokens(self):
        """Test that a superuser can successfully list a target's tokens."""
        PasswordResetToken.objects.create(user=self.target_user, token='some-token')
        response = self._get(self.client, self.target_user.id, token=self.superuser_token)
        assert response.status_code == 200

    def test_returns_empty_list_for_user_with_no_tokens(self):
        """Test that a user with no tokens gets back an empty array."""
        response = self._get(self.client, self.target_user.id, token=self.superuser_token)
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_only_returns_tokens_belonging_to_the_target_user(self):
        """Test that another user's tokens are never included in the response."""
        PasswordResetToken.objects.create(user=self.regular_user, token='someone-elses-token')
        response = self._get(self.client, self.target_user.id, token=self.superuser_token)
        assert json.loads(response.content) == []

    def test_orders_tokens_newest_first(self):
        """Test that tokens are ordered by -created_at, newest first."""
        older = PasswordResetToken.objects.create(user=self.target_user, token='older-token')
        newer = PasswordResetToken.objects.create(user=self.target_user, token='newer-token')

        response = self._get(self.client, self.target_user.id, token=self.superuser_token)

        data = json.loads(response.content)
        assert [row['id'] for row in data] == [newer.id, older.id]

    def test_never_exposes_the_raw_token(self):
        """Test that the raw token value is never present in the response body."""
        PasswordResetToken.objects.create(user=self.target_user, token='super-secret-token')
        response = self._get(self.client, self.target_user.id, token=self.superuser_token)
        assert b'super-secret-token' not in response.content

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse('staff-user-recovery-tokens', kwargs={'user_id': self.target_user.id})
        response = self.client.get(url, HTTP_AUTHORIZATION=f'Token {self.superuser_token.key}')
        assert response.status_code == 200
