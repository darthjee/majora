"""Tests for the password recovery flow (recover, reset-password)."""

import json

import pytest
from django.contrib.auth.models import User
from django.core import mail
from django.utils import timezone
from django.utils.crypto import get_random_string

from games.models import PasswordResetToken

TEST_PASSWORD = get_random_string(20)
NEW_PASSWORD = get_random_string(20)
INVALID_TOKEN_RESPONSE = {'error': 'Invalid or expired token'}


@pytest.mark.django_db
class TestRecoverView:

    """Tests for the recover endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        mail.outbox = []

    def test_sends_email_and_creates_token_for_matching_email(self, client, monkeypatch):
        """Test that a matching email creates a token and sends a recovery email."""
        monkeypatch.setenv('EMAILS_ENABLED', 'true')
        user = User.objects.create_user(
            username='alice', password=TEST_PASSWORD, email='alice@example.com'
        )

        response = client.post(
            '/users/recover.json',
            data=json.dumps({'email': 'alice@example.com'}),
            content_type='application/json',
        )

        assert response.status_code == 200
        assert json.loads(response.content) == {'sent': True}
        assert PasswordResetToken.objects.filter(user=user).exists()
        assert len(mail.outbox) == 1
        assert mail.outbox[0].to == ['alice@example.com']

    def test_does_not_send_email_when_emails_disabled(self, client, monkeypatch):
        """Test that no recovery email is sent when EMAILS_ENABLED is unset."""
        monkeypatch.delenv('EMAILS_ENABLED', raising=False)
        user = User.objects.create_user(
            username='alice', password=TEST_PASSWORD, email='alice@example.com'
        )

        response = client.post(
            '/users/recover.json',
            data=json.dumps({'email': 'alice@example.com'}),
            content_type='application/json',
        )

        assert response.status_code == 200
        assert json.loads(response.content) == {'sent': True}
        assert PasswordResetToken.objects.filter(user=user).exists()
        assert mail.outbox == []

    def test_returns_identical_response_for_non_matching_email(self, client):
        """Test that a non-matching email returns the same response without side effects."""
        response = client.post(
            '/users/recover.json',
            data=json.dumps({'email': 'unknown@example.com'}),
            content_type='application/json',
        )

        assert response.status_code == 200
        assert json.loads(response.content) == {'sent': True}
        assert PasswordResetToken.objects.count() == 0
        assert mail.outbox == []


@pytest.mark.django_db
class TestResetPasswordView:

    """Tests for the reset-password endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.user = User.objects.create_user(username='alice', password=TEST_PASSWORD)

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
