"""Tests for the test-email endpoint."""

import json

import pytest
from django.core import mail
from django.test import TestCase
from django.utils.crypto import get_random_string
from rest_framework.authtoken.models import Token

from games.tests.factories import UserFactory

TEST_PASSWORD = get_random_string(20)


class TestTestEmailView(TestCase):
    """Tests for the test-email endpoint."""

    @pytest.fixture(autouse=True)
    def _inject_monkeypatch(self, monkeypatch):
        """Expose pytest's monkeypatch fixture as an instance attribute."""
        self.monkeypatch = monkeypatch

    def test_sends_email_for_user_with_email(self):
        """Test that an email is sent to the authenticated user's address."""
        self.monkeypatch.setenv('EMAILS_ENABLED', 'true')
        user = UserFactory(
            username='alice', password=TEST_PASSWORD, email='alice@example.com',
            is_staff=True,
        )
        token = Token.objects.create(user=user)

        with self.assertLogs('accounts.views.auth._shared', level='INFO') as log_ctx:
            response = self.client.post(
                '/staff/test-email.json',
                HTTP_AUTHORIZATION=f'Token {token.key}',
            )

        assert response.status_code == 200
        assert json.loads(response.content) == {'sent': True}
        assert len(mail.outbox) == 1
        assert mail.outbox[0].to == ['alice@example.com']
        assert 'alice' in mail.outbox[0].body
        assert any('email_send_attempt' in message for message in log_ctx.output)
        assert any('email_send_succeeded' in message for message in log_ctx.output)

    def test_does_not_send_email_when_emails_disabled(self):
        """Test that no email is sent when EMAILS_ENABLED is unset."""
        self.monkeypatch.delenv('EMAILS_ENABLED', raising=False)
        user = UserFactory(
            username='alice', password=TEST_PASSWORD, email='alice@example.com',
            is_staff=True,
        )
        token = Token.objects.create(user=user)

        with self.assertLogs('accounts.views.auth._shared', level='INFO') as log_ctx:
            response = self.client.post(
                '/staff/test-email.json',
                HTTP_AUTHORIZATION=f'Token {token.key}',
            )

        assert response.status_code == 200
        assert json.loads(response.content) == {'sent': True}
        assert mail.outbox == []
        assert any('email_send_skipped_disabled' in message for message in log_ctx.output)

    def test_logs_and_reraises_when_send_fails(self):
        """Test that a send_mail failure is logged and still propagates."""
        self.monkeypatch.setenv('EMAILS_ENABLED', 'true')
        user = UserFactory(
            username='alice', password=TEST_PASSWORD, email='alice@example.com',
            is_staff=True,
        )
        token = Token.objects.create(user=user)

        def _raise(*args, **kwargs):
            raise RuntimeError('smtp boom')

        self.monkeypatch.setattr('accounts.views.auth._shared.send_mail', _raise)

        with self.assertLogs('accounts.views.auth._shared', level='INFO') as log_ctx:
            with pytest.raises(RuntimeError):
                self.client.post(
                    '/staff/test-email.json',
                    HTTP_AUTHORIZATION=f'Token {token.key}',
                )

        assert any('email_send_failed' in message for message in log_ctx.output)

    def test_rejects_user_without_email(self):
        """Test that no email is sent when the user has no email configured."""
        user = UserFactory(
            username='bob', password=TEST_PASSWORD, email='', is_staff=True
        )
        token = Token.objects.create(user=user)

        response = self.client.post(
            '/staff/test-email.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert response.status_code == 400
        assert json.loads(response.content) == {
            'error': 'User has no email address configured'
        }
        assert mail.outbox == []

    def test_requires_authentication(self):
        """Test that the endpoint rejects unauthenticated requests."""
        response = self.client.post('/staff/test-email.json')

        assert response.status_code == 401
        assert mail.outbox == []

    def test_rejects_non_staff_user(self):
        """Test that an authenticated non-staff, non-superuser user is rejected with 403."""
        user = UserFactory(
            username='carol', password=TEST_PASSWORD, email='carol@example.com'
        )
        token = Token.objects.create(user=user)

        response = self.client.post(
            '/staff/test-email.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert response.status_code == 403
        assert json.loads(response.content) == {'errors': {'detail': ['not_allowed']}}
        assert mail.outbox == []
