"""Tests for the staff recovery-token unexpire view.

POST /staff/users/<id>/recovery-tokens/<token_id>/unexpire.json
"""

import json
from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.authtoken.models import Token

from accounts.models import PasswordResetToken
from games.tests.factories import SuperUserFactory, UserFactory


class TestStaffUserRecoveryTokenUnexpireView(TestCase):
    """Tests for the POST .../recovery-tokens/<token_id>/unexpire.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a target user, staff, superuser, a regular user, and a token."""
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

    def setUp(self):
        """Set up a fresh recovery token for the target user before each test."""
        self.recovery_token = PasswordResetToken.objects.create(
            user=self.target_user, token='some-token'
        )

    def _post(self, client, user_id, token_id, auth_token=None):
        """Issue a POST request to the unexpire endpoint, optionally with an auth token."""
        extra = {}
        if auth_token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {auth_token.key}'
        return client.post(
            f'/staff/users/{user_id}/recovery-tokens/{token_id}/unexpire.json', **extra
        )

    def test_unauthenticated_returns_401(self):
        """Test that an unauthenticated request returns 401."""
        response = self._post(self.client, self.target_user.id, self.recovery_token.id)
        assert response.status_code == 401

    def test_non_staff_non_superuser_returns_403(self):
        """Test that a regular authenticated user returns 403."""
        response = self._post(
            self.client, self.target_user.id, self.recovery_token.id, auth_token=self.regular_token
        )
        assert response.status_code == 403

    def test_returns_404_for_unknown_token(self):
        """Test that 404 is returned for a non-existent token id."""
        response = self._post(
            self.client, self.target_user.id, 999999, auth_token=self.superuser_token
        )
        assert response.status_code == 404

    def test_response_includes_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._post(
            self.client,
            self.target_user.id,
            self.recovery_token.id,
            auth_token=self.superuser_token,
        )
        assert response['X-Skip-Cache'] == 'true'

    def test_unexpiring_a_revoked_token_clears_invalidated_at_and_extends_expiration(self):
        """Test that unexpiring a force-expired token clears invalidated_at, extends expires_at."""
        self.recovery_token.invalidated_at = timezone.now()
        self.recovery_token.expires_at = timezone.now() - timedelta(minutes=5)
        self.recovery_token.save()

        response = self._post(
            self.client, self.target_user.id, self.recovery_token.id, auth_token=self.staff_token
        )

        assert response.status_code == 200
        self.recovery_token.refresh_from_db()
        assert self.recovery_token.invalidated_at is None
        assert self.recovery_token.expires_at > timezone.now()

    def test_unexpiring_a_used_token_leaves_used_at_set(self):
        """Test that unexpiring an already-used token succeeds but the row stays invalid."""
        self.recovery_token.used_at = timezone.now()
        self.recovery_token.save()

        response = self._post(
            self.client,
            self.target_user.id,
            self.recovery_token.id,
            auth_token=self.superuser_token,
        )

        assert response.status_code == 200
        self.recovery_token.refresh_from_db()
        assert self.recovery_token.used_at is not None
        assert not self.recovery_token.is_valid()

    def test_token_belonging_to_a_different_user_404s(self):
        """Test that a token belonging to a different user 404s (ownership check)."""
        response = self._post(
            self.client,
            self.regular_user.id,
            self.recovery_token.id,
            auth_token=self.superuser_token,
        )
        assert response.status_code == 404

    def test_response_body_and_status_is_200_empty_object(self):
        """Test that a successful response body is `{}` with status 200."""
        response = self._post(
            self.client,
            self.target_user.id,
            self.recovery_token.id,
            auth_token=self.superuser_token,
        )
        assert response.status_code == 200
        assert json.loads(response.content) == {}

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'staff-user-recovery-token-unexpire',
            kwargs={'user_id': self.target_user.id, 'token_id': self.recovery_token.id},
        )
        response = self.client.post(url, HTTP_AUTHORIZATION=f'Token {self.superuser_token.key}')
        assert response.status_code == 200
