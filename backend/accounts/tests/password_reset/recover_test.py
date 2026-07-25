"""Tests for the recover endpoint."""

import json

import pytest
from django.core import mail
from django.test import TestCase
from django.utils.crypto import get_random_string

from accounts.models import PasswordResetToken, UserProfile
from games.tests.factories import UserFactory, UserProfileFactory

TEST_PASSWORD = get_random_string(20)


class TestRecoverView(TestCase):
    """Tests for the recover endpoint."""

    @pytest.fixture(autouse=True)
    def _inject_monkeypatch(self, monkeypatch):
        """Expose pytest's monkeypatch fixture as an instance attribute."""
        self.monkeypatch = monkeypatch

    def test_sends_email_and_creates_token_for_matching_email(self):
        """Test that a matching email creates a token and sends a recovery email."""
        self.monkeypatch.setenv('EMAILS_ENABLED', 'true')
        user = UserFactory(
            username='alice', password=TEST_PASSWORD, email='alice@example.com'
        )

        response = self.client.post(
            '/users/recover.json',
            data=json.dumps({'email': 'alice@example.com'}),
            content_type='application/json',
        )

        assert response.status_code == 200
        assert json.loads(response.content) == {'sent': True}
        assert PasswordResetToken.objects.filter(user=user).exists()
        assert len(mail.outbox) == 1
        assert mail.outbox[0].to == ['alice@example.com']

    def test_does_not_send_email_when_emails_disabled(self):
        """Test that no recovery email is sent when EMAILS_ENABLED is unset."""
        self.monkeypatch.delenv('EMAILS_ENABLED', raising=False)
        user = UserFactory(
            username='alice', password=TEST_PASSWORD, email='alice@example.com'
        )

        response = self.client.post(
            '/users/recover.json',
            data=json.dumps({'email': 'alice@example.com'}),
            content_type='application/json',
        )

        assert response.status_code == 200
        assert json.loads(response.content) == {'sent': True}
        assert PasswordResetToken.objects.filter(user=user).exists()
        assert mail.outbox == []

    def test_creates_token_and_sends_email_for_denied_user(self):
        """Test that a denied user's matching email creates a token and sends an email too.

        Denied users must not be distinguishable from pending/approved ones via side
        effects (token creation, email dispatch): they're rejected later, at token
        consumption time, instead (see `reset_password_test.py`).
        """
        self.monkeypatch.setenv('EMAILS_ENABLED', 'true')
        user = UserFactory(
            username='alice', password=TEST_PASSWORD, email='alice@example.com'
        )
        UserProfileFactory(user=user, status=UserProfile.STATUS_DENIED)

        response = self.client.post(
            '/users/recover.json',
            data=json.dumps({'email': 'alice@example.com'}),
            content_type='application/json',
        )

        assert response.status_code == 200
        assert json.loads(response.content) == {'sent': True}
        assert PasswordResetToken.objects.filter(user=user).exists()
        assert len(mail.outbox) == 1
        assert mail.outbox[0].to == ['alice@example.com']

    def test_returns_sent_true_for_pending_user(self):
        """Test that a pending user's matching email still succeeds like an approved one."""
        user = UserFactory(
            username='alice', password=TEST_PASSWORD, email='alice@example.com'
        )
        UserProfileFactory(user=user, status=UserProfile.STATUS_PENDING)

        response = self.client.post(
            '/users/recover.json',
            data=json.dumps({'email': 'alice@example.com'}),
            content_type='application/json',
        )

        assert response.status_code == 200
        assert json.loads(response.content) == {'sent': True}
        assert PasswordResetToken.objects.filter(user=user).exists()

    def test_returns_identical_response_for_non_matching_email(self):
        """Test that a non-matching email returns the same response without side effects."""
        response = self.client.post(
            '/users/recover.json',
            data=json.dumps({'email': 'unknown@example.com'}),
            content_type='application/json',
        )

        assert response.status_code == 200
        assert json.loads(response.content) == {'sent': True}
        assert PasswordResetToken.objects.count() == 0
        assert mail.outbox == []
