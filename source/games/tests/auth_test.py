"""Tests for authentication endpoints (login, register, logout)."""

import json

import pytest
from django.contrib.auth.models import User
from django.core import mail
from django.utils.crypto import get_random_string
from rest_framework.authtoken.models import Token

TEST_PASSWORD = get_random_string(20)


@pytest.mark.django_db
class TestLoginView:
    """Tests for the login endpoint."""

    def test_returns_token_for_valid_credentials(self, client):
        """Test that a valid login returns a token."""
        User.objects.create_user(username='alice', password=TEST_PASSWORD)
        response = client.post(
            '/users/login.json',
            data=json.dumps({'username': 'alice', 'password': TEST_PASSWORD}),
            content_type='application/json',
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert 'token' in data
        assert Token.objects.filter(key=data['token'], user__username='alice').exists()

    def test_returns_unauthorized_for_invalid_credentials(self, client):
        """Test that invalid credentials are rejected."""
        User.objects.create_user(username='alice', password=TEST_PASSWORD)
        response = client.post(
            '/users/login.json',
            data=json.dumps({'username': 'alice', 'password': 'wrong'}),
            content_type='application/json',
        )
        assert response.status_code == 401

    def test_stores_token_in_session_on_success(self, client):
        """Test that a successful login stores the auth token in the session."""
        User.objects.create_user(username='alice', password=TEST_PASSWORD)
        response = client.post(
            '/users/login.json',
            data=json.dumps({'username': 'alice', 'password': TEST_PASSWORD}),
            content_type='application/json',
        )
        data = json.loads(response.content)
        assert client.session['auth_token'] == data['token']


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


@pytest.mark.django_db
class TestLogoutView:
    """Tests for the logout endpoint."""

    def test_revokes_token(self, client):
        """Test that logout deletes the user's token."""
        user = User.objects.create_user(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)

        response = client.delete(
            '/users/logout.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert response.status_code == 204
        assert not Token.objects.filter(user=user).exists()

    def test_requires_authentication(self, client):
        """Test that logout without a token is rejected."""
        response = client.delete('/users/logout.json')
        assert response.status_code == 401

    def test_subsequent_request_with_deleted_token_fails(self, client):
        """Test that a deleted token can no longer authenticate."""
        user = User.objects.create_user(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)

        client.delete('/users/logout.json', HTTP_AUTHORIZATION=f'Token {token.key}')
        response = client.delete('/users/logout.json', HTTP_AUTHORIZATION=f'Token {token.key}')

        assert response.status_code == 401

    def test_flushes_session_on_logout(self, client):
        """Test that logout flushes the session so no auth_token remains."""
        user = User.objects.create_user(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)
        session = client.session
        session['auth_token'] = token.key
        session.save()

        client.delete('/users/logout.json', HTTP_AUTHORIZATION=f'Token {token.key}')

        assert 'auth_token' not in client.session

    def test_post_returns_method_not_allowed(self, client):
        """Test that POST to the logout endpoint returns 405 Method Not Allowed."""
        user = User.objects.create_user(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)

        response = client.post(
            '/users/logout.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert response.status_code == 405


@pytest.mark.django_db
class TestStatusView:
    """Tests for the status endpoint."""

    def test_returns_logged_in_for_valid_token(self, client):
        """Test that a valid token reports logged_in true with the username."""
        user = User.objects.create_user(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)

        response = client.get(
            '/users/status.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert response.status_code == 200
        assert json.loads(response.content) == {
            'logged_in': True,
            'username': 'alice',
            'user_id': user.id,
            'settings': {'favorite_language': 'en'},
        }

    def test_returns_logged_out_for_missing_token(self, client):
        """Test that a missing Authorization header reports logged_in false."""
        response = client.get('/users/status.json')

        assert response.status_code == 200
        assert json.loads(response.content) == {'logged_in': False}

    def test_returns_logged_out_for_invalid_token(self, client):
        """Test that an invalid token reports logged_in false instead of 401."""
        response = client.get(
            '/users/status.json',
            HTTP_AUTHORIZATION='Token garbage-token-value',
        )

        assert response.status_code == 200
        assert json.loads(response.content) == {'logged_in': False}

    def test_returns_logged_in_via_session_and_includes_token(self, client):
        """Test that a valid session cookie (no Authorization header) returns logged_in true."""
        user = User.objects.create_user(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)
        session = client.session
        session['auth_token'] = token.key
        session.save()

        response = client.get('/users/status.json')

        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['logged_in'] is True
        assert data['username'] == 'alice'
        assert data['token'] == token.key

    def test_returns_logged_out_for_stale_session_token(self, client):
        """Test that a session referencing a deleted token returns logged_in false."""
        user = User.objects.create_user(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)
        session = client.session
        session['auth_token'] = token.key
        session.save()
        token.delete()

        response = client.get('/users/status.json')

        assert response.status_code == 200
        assert json.loads(response.content) == {'logged_in': False}


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


@pytest.mark.django_db
class TestLanguageView:
    """Tests for the language preference endpoint."""

    def test_updates_favorite_language(self, client):
        """Test that an authenticated request updates the favorite language."""
        user = User.objects.create_user(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)

        response = client.post(
            '/users/language.json',
            data=json.dumps({'language': 'pt-BR'}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert response.status_code == 200
        assert json.loads(response.content) == {'favorite_language': 'pt-BR'}

    def test_status_reflects_updated_language(self, client):
        """Test that status.json reflects the language set previously."""
        user = User.objects.create_user(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)

        client.post(
            '/users/language.json',
            data=json.dumps({'language': 'fr'}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        response = client.get(
            '/users/status.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['settings']['favorite_language'] == 'fr'

    def test_requires_authentication(self, client):
        """Test that the endpoint rejects unauthenticated requests."""
        response = client.post(
            '/users/language.json',
            data=json.dumps({'language': 'fr'}),
            content_type='application/json',
        )

        assert response.status_code == 401
