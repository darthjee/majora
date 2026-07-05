"""Tests for the staff user recovery-link view (POST /staff/users/<id>/recovery-link.json)."""

import json
from datetime import timedelta

import pytest
from django.contrib.auth.models import User
from django.core import mail
from django.urls import reverse
from django.utils import timezone
from rest_framework.authtoken.models import Token

from games.models import PasswordResetToken


@pytest.mark.django_db
class TestStaffUserRecoveryLinkView:

    """Tests for the POST /staff/users/<id>/recovery-link.json endpoint."""

    def setup_method(self):
        """Set up a target user, staff, superuser, and a regular user."""
        mail.outbox = []
        self.target_user = User.objects.create_user(
            username='target', password='secret-password', email='target@example.com'
        )
        self.staff_user = User.objects.create_user(
            username='staffer', password='secret-password', is_staff=True
        )
        self.staff_token = Token.objects.create(user=self.staff_user)
        self.superuser = User.objects.create_superuser(username='admin', password='secret-password')
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = User.objects.create_user(username='player', password='secret-password')
        self.regular_token = Token.objects.create(user=self.regular_user)

    def _post(self, client, user_id, token=None):
        """Issue a POST request to the recovery-link endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.post(f'/staff/users/{user_id}/recovery-link.json', **extra)

    def test_unauthenticated_returns_401(self, client):
        """Test that an unauthenticated request returns 401."""
        response = self._post(client, self.target_user.id)
        assert response.status_code == 401

    def test_non_staff_non_superuser_returns_403(self, client):
        """Test that a regular authenticated user returns 403."""
        response = self._post(client, self.target_user.id, token=self.regular_token)
        assert response.status_code == 403

    def test_returns_404_for_unknown_user(self, client):
        """Test that 404 is returned for a non-existent user id."""
        response = self._post(client, 999999, token=self.superuser_token)
        assert response.status_code == 404

    def test_staff_user_creates_token_when_none_exists(self, client):
        """Test that a staff user gets a fresh token when the target has none."""
        assert PasswordResetToken.objects.filter(user=self.target_user).count() == 0

        response = self._post(client, self.target_user.id, token=self.staff_token)

        assert response.status_code == 200
        data = json.loads(response.content)
        token = PasswordResetToken.objects.get(user=self.target_user)
        assert data['url'] == f'http://localhost:3000/#/recover-password?token={token.token}'

    def test_superuser_creates_token_when_none_exists(self, client):
        """Test that a superuser gets a fresh token when the target has none."""
        response = self._post(client, self.target_user.id, token=self.superuser_token)
        assert response.status_code == 200
        assert PasswordResetToken.objects.filter(user=self.target_user).count() == 1

    def test_reuses_existing_valid_token(self, client):
        """Test that an existing valid token is reused instead of creating a new one."""
        existing = PasswordResetToken.objects.create(user=self.target_user, token='valid-token')

        response = self._post(client, self.target_user.id, token=self.superuser_token)

        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['url'].endswith('token=valid-token')
        assert PasswordResetToken.objects.filter(user=self.target_user).count() == 1
        existing.refresh_from_db()
        assert existing.token == 'valid-token'

    def test_creates_new_token_when_existing_is_used(self, client):
        """Test that a new token is created when the existing one has been used."""
        used = PasswordResetToken.objects.create(user=self.target_user, token='used-token')
        used.used_at = timezone.now()
        used.save()

        response = self._post(client, self.target_user.id, token=self.superuser_token)

        assert response.status_code == 200
        assert PasswordResetToken.objects.filter(user=self.target_user).count() == 2
        data = json.loads(response.content)
        assert not data['url'].endswith('token=used-token')

    def test_creates_new_token_when_existing_is_expired(self, client):
        """Test that a new token is created when the existing one has expired."""
        expired = PasswordResetToken.objects.create(user=self.target_user, token='expired-token')
        PasswordResetToken.objects.filter(pk=expired.pk).update(
            created_at=timezone.now() - timedelta(minutes=1000)
        )

        response = self._post(client, self.target_user.id, token=self.superuser_token)

        assert response.status_code == 200
        assert PasswordResetToken.objects.filter(user=self.target_user).count() == 2
        data = json.loads(response.content)
        assert not data['url'].endswith('token=expired-token')

    def test_does_not_send_email(self, client):
        """Test that no email is ever sent by this endpoint."""
        response = self._post(client, self.target_user.id, token=self.superuser_token)
        assert response.status_code == 200
        assert mail.outbox == []

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('staff-user-recovery-link', kwargs={'user_id': self.target_user.id})
        response = client.post(url, HTTP_AUTHORIZATION=f'Token {self.superuser_token.key}')
        assert response.status_code == 200
