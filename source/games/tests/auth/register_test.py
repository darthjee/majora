"""Tests for the register endpoint."""

import json

import pytest
from django.contrib.auth.models import User
from django.core import mail
from django.utils.crypto import get_random_string
from rest_framework.authtoken.models import Token

TEST_PASSWORD = get_random_string(20)


@pytest.mark.django_db
class TestRegisterView:
    """Tests for the register endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        mail.outbox = []
        self.valid_payload = {
            'name': 'bob',
            'email': 'bob@example.com',
            'password': TEST_PASSWORD,
            'password_confirmation': TEST_PASSWORD,
        }

    def _post(self, client, payload):
        """Post a registration payload to the endpoint."""
        return client.post(
            '/users/register.json',
            data=json.dumps(payload),
            content_type='application/json',
        )

    def test_creates_user_and_returns_token(self, client):
        """Test that a new user is created and a token is returned for auto-login."""
        response = self._post(client, self.valid_payload)

        assert response.status_code == 201
        data = json.loads(response.content)
        assert data['username'] == 'bob'
        assert 'token' in data
        assert User.objects.filter(username='bob', email='bob@example.com').exists()
        assert Token.objects.filter(key=data['token'], user__username='bob').exists()

    def test_stores_token_in_session_on_success(self, client):
        """Test that a successful registration stores the auth token in the session."""
        response = self._post(client, self.valid_payload)

        data = json.loads(response.content)
        assert client.session['auth_token'] == data['token']

    def test_rejects_missing_name(self, client):
        """Test that registering without a name fails."""
        payload = {**self.valid_payload, 'name': ''}
        response = self._post(client, payload)
        assert response.status_code == 400

    def test_rejects_missing_email(self, client):
        """Test that registering without an email fails."""
        payload = {**self.valid_payload, 'email': ''}
        response = self._post(client, payload)
        assert response.status_code == 400

    def test_rejects_missing_password(self, client):
        """Test that registering without a password fails."""
        payload = {**self.valid_payload, 'password': ''}
        response = self._post(client, payload)
        assert response.status_code == 400

    def test_rejects_missing_password_confirmation(self, client):
        """Test that registering without a password confirmation fails."""
        payload = {**self.valid_payload, 'password_confirmation': ''}
        response = self._post(client, payload)
        assert response.status_code == 400

    def test_rejects_mismatched_password_confirmation(self, client):
        """Test that registering with a mismatched confirmation fails."""
        payload = {**self.valid_payload, 'password_confirmation': 'something-else'}
        response = self._post(client, payload)
        assert response.status_code == 400

    def test_rejects_invalid_email_format(self, client):
        """Test that registering with an invalid email format fails."""
        payload = {**self.valid_payload, 'email': 'not-an-email'}
        response = self._post(client, payload)
        assert response.status_code == 400

    def test_rejects_duplicate_email(self, client):
        """Test that registering with an already-used email fails."""
        User.objects.create_user(
            username='alice', password=TEST_PASSWORD, email='bob@example.com'
        )
        response = self._post(client, self.valid_payload)
        assert response.status_code == 400

    def test_rejects_duplicate_name(self, client):
        """Test that registering with an already-used name fails."""
        User.objects.create_user(username='bob', password=TEST_PASSWORD)
        response = self._post(client, self.valid_payload)
        assert response.status_code == 400

    def test_rejects_unexpected_extra_field(self, client):
        """Test that registering with an unexpected extra field fails."""
        payload = {**self.valid_payload, 'is_admin': True}
        response = self._post(client, payload)
        assert response.status_code == 400

    def test_sends_welcome_email_when_emails_enabled(self, client, settings, monkeypatch):
        """Test that a welcome email is sent on success when EMAILS_ENABLED is true."""
        monkeypatch.setenv('EMAILS_ENABLED', 'true')
        response = self._post(client, self.valid_payload)

        assert response.status_code == 201
        assert len(mail.outbox) == 1
        assert mail.outbox[0].to == ['bob@example.com']
        assert 'bob' in mail.outbox[0].body

    def test_does_not_send_welcome_email_when_emails_disabled(self, client, monkeypatch):
        """Test that no welcome email is sent when EMAILS_ENABLED is unset."""
        monkeypatch.delenv('EMAILS_ENABLED', raising=False)
        response = self._post(client, self.valid_payload)

        assert response.status_code == 201
        assert mail.outbox == []

    def test_does_not_send_welcome_email_when_emails_explicitly_disabled(
        self, client, monkeypatch
    ):
        """Test that no welcome email is sent when EMAILS_ENABLED is false."""
        monkeypatch.setenv('EMAILS_ENABLED', 'false')
        response = self._post(client, self.valid_payload)

        assert response.status_code == 201
        assert mail.outbox == []
