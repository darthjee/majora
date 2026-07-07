"""Tests for the recover endpoint."""

import json

import pytest
from django.core import mail
from django.utils.crypto import get_random_string

from games.models import PasswordResetToken
from games.tests.factories import UserFactory

TEST_PASSWORD = get_random_string(20)


@pytest.mark.django_db
class TestRecoverView:
    """Tests for the recover endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        mail.outbox = []

    def test_sends_email_and_creates_token_for_matching_email(self, client, monkeypatch):
        """Test that a matching email creates a token and sends a recovery email."""
        monkeypatch.setenv('EMAILS_ENABLED', 'true')
        user = UserFactory(
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
        user = UserFactory(
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
