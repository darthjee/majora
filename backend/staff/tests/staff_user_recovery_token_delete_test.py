"""Tests for the staff recovery-token delete view.

DELETE /staff/users/<id>/recovery-tokens/<token_id>.json
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from accounts.models import PasswordResetToken
from games.tests.factories import SuperUserFactory, UserFactory


class TestStaffUserRecoveryTokenDeleteView(TestCase):
    """Tests for the DELETE .../recovery-tokens/<token_id>.json endpoint."""

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

    def _delete(self, client, user_id, token_id, auth_token=None):
        """Issue a DELETE request to the delete endpoint, optionally with an auth token."""
        extra = {}
        if auth_token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {auth_token.key}'
        return client.delete(
            f'/staff/users/{user_id}/recovery-tokens/{token_id}.json', **extra
        )

    def test_unauthenticated_returns_401(self):
        """Test that an unauthenticated request returns 401."""
        response = self._delete(self.client, self.target_user.id, self.recovery_token.id)
        assert response.status_code == 401

    def test_non_staff_non_superuser_returns_403(self):
        """Test that a regular authenticated user returns 403."""
        response = self._delete(
            self.client,
            self.target_user.id,
            self.recovery_token.id,
            auth_token=self.regular_token,
        )
        assert response.status_code == 403

    def test_returns_404_for_unknown_token(self):
        """Test that 404 is returned for a non-existent token id."""
        response = self._delete(
            self.client, self.target_user.id, 999999, auth_token=self.superuser_token
        )
        assert response.status_code == 404

    def test_response_includes_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._delete(
            self.client,
            self.target_user.id,
            self.recovery_token.id,
            auth_token=self.superuser_token,
        )
        assert response['X-Skip-Cache'] == 'true'

    def test_deleting_a_token_removes_the_row(self):
        """Test that deleting a token removes the row and returns 204 with no body."""
        token_id = self.recovery_token.id

        response = self._delete(
            self.client, self.target_user.id, token_id, auth_token=self.staff_token
        )

        assert response.status_code == 204
        assert response.content == b''
        assert not PasswordResetToken.objects.filter(pk=token_id).exists()

    def test_deleting_the_users_only_token_is_allowed(self):
        """Test that deleting the user's only/last valid token is allowed."""
        assert PasswordResetToken.objects.filter(user=self.target_user).count() == 1

        response = self._delete(
            self.client,
            self.target_user.id,
            self.recovery_token.id,
            auth_token=self.superuser_token,
        )

        assert response.status_code == 204
        assert PasswordResetToken.objects.filter(user=self.target_user).count() == 0

    def test_token_belonging_to_a_different_user_404s(self):
        """Test that a token belonging to a different user 404s (ownership check)."""
        response = self._delete(
            self.client,
            self.regular_user.id,
            self.recovery_token.id,
            auth_token=self.superuser_token,
        )
        assert response.status_code == 404

    def test_deleting_an_already_deleted_token_404s(self):
        """Test that deleting an already-deleted token id 404s (stale-list/race)."""
        token_id = self.recovery_token.id
        self.recovery_token.delete()

        response = self._delete(
            self.client, self.target_user.id, token_id, auth_token=self.superuser_token
        )

        assert response.status_code == 404

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'staff-user-recovery-token-delete',
            kwargs={'user_id': self.target_user.id, 'token_id': self.recovery_token.id},
        )
        response = self.client.delete(url, HTTP_AUTHORIZATION=f'Token {self.superuser_token.key}')
        assert response.status_code == 204
