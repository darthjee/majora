"""Tests for the reset-password endpoint."""

import json

import pytest
from django.test import TestCase
from django.utils import timezone
from django.utils.crypto import get_random_string

from accounts.models import PasswordResetToken
from games.tests.factories import UserFactory

TEST_PASSWORD = get_random_string(20)
NEW_PASSWORD = get_random_string(20)
INVALID_TOKEN_RESPONSE = {'error': 'Invalid or expired token'}


class TestResetPasswordView(TestCase):
    """Tests for the reset-password endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.user = UserFactory(username='alice', password=TEST_PASSWORD)

    @pytest.fixture(autouse=True)
    def _inject_monkeypatch(self, monkeypatch):
        """Expose pytest's monkeypatch fixture as an instance attribute."""
        self.monkeypatch = monkeypatch

    def test_resets_password_for_valid_token(self):
        """Test that a fresh valid token allows setting a new password."""
        reset_token = PasswordResetToken.objects.create(user=self.user, token='valid-token')

        response = self.client.post(
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

    def test_rejects_already_used_token(self):
        """Test that an already-used token is rejected with a generic error."""
        PasswordResetToken.objects.create(
            user=self.user, token='used-token', used_at=timezone.now()
        )

        response = self.client.post(
            '/users/reset-password.json',
            data=json.dumps({'token': 'used-token', 'password': NEW_PASSWORD}),
            content_type='application/json',
        )

        assert response.status_code == 400
        assert json.loads(response.content) == INVALID_TOKEN_RESPONSE

    def test_rejects_expired_token(self):
        """Test that an expired token is rejected with a generic error."""
        self.monkeypatch.setenv('MAJORA_PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES', '0')
        PasswordResetToken.objects.create(user=self.user, token='expired-token')

        response = self.client.post(
            '/users/reset-password.json',
            data=json.dumps({'token': 'expired-token', 'password': NEW_PASSWORD}),
            content_type='application/json',
        )

        assert response.status_code == 400
        assert json.loads(response.content) == INVALID_TOKEN_RESPONSE

    def test_rejects_unknown_token(self):
        """Test that an unknown token is rejected with a generic error."""
        response = self.client.post(
            '/users/reset-password.json',
            data=json.dumps({'token': 'garbage-token', 'password': NEW_PASSWORD}),
            content_type='application/json',
        )

        assert response.status_code == 400
        assert json.loads(response.content) == INVALID_TOKEN_RESPONSE
