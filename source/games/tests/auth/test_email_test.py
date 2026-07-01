"""Tests for the test-email endpoint."""

import json

import pytest
from django.contrib.auth.models import User
from django.core import mail
from django.utils.crypto import get_random_string
from rest_framework.authtoken.models import Token

TEST_PASSWORD = get_random_string(20)


@pytest.mark.django_db
class TestTestEmailView:
    """Tests for the test-email endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        mail.outbox = []

    def test_sends_email_for_user_with_email(self, client, monkeypatch):
        """Test that an email is sent to the authenticated user's address."""
        monkeypatch.setenv('EMAILS_ENABLED', 'true')
        user = User.objects.create_user(
            username='alice', password=TEST_PASSWORD, email='alice@example.com'
        )
        token = Token.objects.create(user=user)

        response = client.post(
            '/users/test-email.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert response.status_code == 200
        assert json.loads(response.content) == {'sent': True}
        assert len(mail.outbox) == 1
        assert mail.outbox[0].to == ['alice@example.com']
        assert 'alice' in mail.outbox[0].body

    def test_does_not_send_email_when_emails_disabled(self, client, monkeypatch):
        """Test that no email is sent when EMAILS_ENABLED is unset."""
        monkeypatch.delenv('EMAILS_ENABLED', raising=False)
        user = User.objects.create_user(
            username='alice', password=TEST_PASSWORD, email='alice@example.com'
        )
        token = Token.objects.create(user=user)

        response = client.post(
            '/users/test-email.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert response.status_code == 200
        assert json.loads(response.content) == {'sent': True}
        assert mail.outbox == []

    def test_rejects_user_without_email(self, client):
        """Test that no email is sent when the user has no email configured."""
        user = User.objects.create_user(username='bob', password=TEST_PASSWORD, email='')
        token = Token.objects.create(user=user)

        response = client.post(
            '/users/test-email.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert response.status_code == 400
        assert json.loads(response.content) == {
            'error': 'User has no email address configured'
        }
        assert mail.outbox == []

    def test_requires_authentication(self, client):
        """Test that the endpoint rejects unauthenticated requests."""
        response = client.post('/users/test-email.json')

        assert response.status_code == 401
        assert mail.outbox == []
