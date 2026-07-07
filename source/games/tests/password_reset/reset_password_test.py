"""Tests for the reset-password endpoint."""

import json

import pytest
from django.utils import timezone
from django.utils.crypto import get_random_string

from games.models import PasswordResetToken
from games.tests.factories import UserFactory

TEST_PASSWORD = get_random_string(20)
NEW_PASSWORD = get_random_string(20)
INVALID_TOKEN_RESPONSE = {'error': 'Invalid or expired token'}


@pytest.mark.django_db
class TestResetPasswordView:
    """Tests for the reset-password endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.user = UserFactory(username='alice', password=TEST_PASSWORD)

    def test_resets_password_for_valid_token(self, client):
        """Test that a fresh valid token allows setting a new password."""
        reset_token = PasswordResetToken.objects.create(user=self.user, token='valid-token')

        response = client.post(
            '/users/reset-password.json',
            data=json.dumps({'token': 'valid-token', 'password': NEW_PASSWORD}),
            content_type='application/json',
        )

        assert response.status_code == 200
        assert json.loads(response.content) == {'reset': True}

        self.user.refresh_from_db()
        assert self.user.check_password(NEW_PASSWORD)

        reset_token.refresh_from_db()
        assert reset_token.used_at is not None

    def test_rejects_already_used_token(self, client):
        """Test that an already-used token is rejected with a generic error."""
        PasswordResetToken.objects.create(
            user=self.user, token='used-token', used_at=timezone.now()
        )

        response = client.post(
            '/users/reset-password.json',
            data=json.dumps({'token': 'used-token', 'password': NEW_PASSWORD}),
            content_type='application/json',
        )

        assert response.status_code == 400
        assert json.loads(response.content) == INVALID_TOKEN_RESPONSE

    def test_rejects_expired_token(self, client, monkeypatch):
        """Test that an expired token is rejected with a generic error."""
        monkeypatch.setenv('MAJORA_PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES', '0')
        PasswordResetToken.objects.create(user=self.user, token='expired-token')

        response = client.post(
            '/users/reset-password.json',
            data=json.dumps({'token': 'expired-token', 'password': NEW_PASSWORD}),
            content_type='application/json',
        )

        assert response.status_code == 400
        assert json.loads(response.content) == INVALID_TOKEN_RESPONSE

    def test_rejects_unknown_token(self, client):
        """Test that an unknown token is rejected with a generic error."""
        response = client.post(
            '/users/reset-password.json',
            data=json.dumps({'token': 'garbage-token', 'password': NEW_PASSWORD}),
            content_type='application/json',
        )

        assert response.status_code == 400
        assert json.loads(response.content) == INVALID_TOKEN_RESPONSE
