"""Tests for the register endpoint."""

import json

import pytest
from django.contrib.auth.models import User
from django.core import mail
from django.test import TestCase
from django.utils.crypto import get_random_string
from rest_framework.authtoken.models import Token

from games.models import UserProfile
from games.tests.factories import UserFactory, UserProfileFactory

TEST_PASSWORD = get_random_string(20)


class TestRegisterView(TestCase):
    """Tests for the register endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.valid_payload = {
            'name': 'bob',
            'display_name': 'bob-display',
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

    @pytest.fixture(autouse=True)
    def _inject_monkeypatch(self, monkeypatch):
        """Expose pytest's monkeypatch fixture as an instance attribute."""
        self.monkeypatch = monkeypatch

    def test_creates_user_and_returns_token(self):
        """Test that a new user is created and a token is returned for auto-login."""
        response = self._post(self.client, self.valid_payload)

        assert response.status_code == 201
        data = json.loads(response.content)
        assert data['username'] == 'bob'
        assert 'token' in data
        assert User.objects.filter(username='bob', email='bob@example.com').exists()
        assert Token.objects.filter(key=data['token'], user__username='bob').exists()
        assert UserProfile.objects.filter(
            user__username='bob', display_name='bob-display'
        ).exists()

    def test_stores_token_in_session_on_success(self):
        """Test that a successful registration stores the auth token in the session."""
        response = self._post(self.client, self.valid_payload)

        data = json.loads(response.content)
        assert self.client.session['auth_token'] == data['token']

    def test_rejects_missing_name(self):
        """Test that registering without a name fails."""
        payload = {**self.valid_payload, 'name': ''}
        response = self._post(self.client, payload)
        assert response.status_code == 400

    def test_rejects_missing_display_name(self):
        """Test that registering without a display_name fails."""
        payload = {**self.valid_payload, 'display_name': ''}
        response = self._post(self.client, payload)
        assert response.status_code == 400

    def test_rejects_missing_email(self):
        """Test that registering without an email fails."""
        payload = {**self.valid_payload, 'email': ''}
        response = self._post(self.client, payload)
        assert response.status_code == 400

    def test_rejects_missing_password(self):
        """Test that registering without a password fails."""
        payload = {**self.valid_payload, 'password': ''}
        response = self._post(self.client, payload)
        assert response.status_code == 400

    def test_rejects_missing_password_confirmation(self):
        """Test that registering without a password confirmation fails."""
        payload = {**self.valid_payload, 'password_confirmation': ''}
        response = self._post(self.client, payload)
        assert response.status_code == 400

    def test_rejects_mismatched_password_confirmation(self):
        """Test that registering with a mismatched confirmation fails."""
        payload = {**self.valid_payload, 'password_confirmation': 'something-else'}
        response = self._post(self.client, payload)
        assert response.status_code == 400

    def test_rejects_invalid_email_format(self):
        """Test that registering with an invalid email format fails."""
        payload = {**self.valid_payload, 'email': 'not-an-email'}
        response = self._post(self.client, payload)
        assert response.status_code == 400

    def test_rejects_duplicate_email(self):
        """Test that registering with an already-used email fails."""
        UserFactory(
            username='alice', password=TEST_PASSWORD, email='bob@example.com'
        )
        response = self._post(self.client, self.valid_payload)
        assert response.status_code == 400

    def test_rejects_duplicate_name(self):
        """Test that registering with an already-used name fails."""
        UserFactory(username='bob', password=TEST_PASSWORD)
        response = self._post(self.client, self.valid_payload)
        assert response.status_code == 400

    def test_rejects_duplicate_display_name(self):
        """Test that registering with an already-used display_name fails."""
        other_user = UserFactory(username='alice', password=TEST_PASSWORD)
        UserProfileFactory(user=other_user, display_name='bob-display')
        response = self._post(self.client, self.valid_payload)
        assert response.status_code == 400

    def test_rejects_unexpected_extra_field(self):
        """Test that registering with an unexpected extra field fails."""
        payload = {**self.valid_payload, 'is_admin': True}
        response = self._post(self.client, payload)
        assert response.status_code == 400

    def test_sends_welcome_email_when_emails_enabled(self):
        """Test that a welcome email is sent on success when EMAILS_ENABLED is true."""
        self.monkeypatch.setenv('EMAILS_ENABLED', 'true')
        response = self._post(self.client, self.valid_payload)

        assert response.status_code == 201
        assert len(mail.outbox) == 1
        assert mail.outbox[0].to == ['bob@example.com']
        assert 'bob' in mail.outbox[0].body

    def test_does_not_send_welcome_email_when_emails_disabled(self):
        """Test that no welcome email is sent when EMAILS_ENABLED is unset."""
        self.monkeypatch.delenv('EMAILS_ENABLED', raising=False)
        response = self._post(self.client, self.valid_payload)

        assert response.status_code == 201
        assert mail.outbox == []

    def test_does_not_send_welcome_email_when_emails_explicitly_disabled(self):
        """Test that no welcome email is sent when EMAILS_ENABLED is false."""
        self.monkeypatch.setenv('EMAILS_ENABLED', 'false')
        response = self._post(self.client, self.valid_payload)

        assert response.status_code == 201
        assert mail.outbox == []
