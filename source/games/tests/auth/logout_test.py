"""Tests for the logout endpoint."""

import pytest
from django.utils.crypto import get_random_string
from rest_framework.authtoken.models import Token

from games.tests.factories import UserFactory

TEST_PASSWORD = get_random_string(20)


@pytest.mark.django_db
class TestLogoutView:
    """Tests for the logout endpoint."""

    def test_revokes_token(self, client):
        """Test that logout deletes the user's token."""
        user = UserFactory(username='alice', password=TEST_PASSWORD)
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
        user = UserFactory(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)

        client.delete('/users/logout.json', HTTP_AUTHORIZATION=f'Token {token.key}')
        response = client.delete('/users/logout.json', HTTP_AUTHORIZATION=f'Token {token.key}')

        assert response.status_code == 401

    def test_flushes_session_on_logout(self, client):
        """Test that logout flushes the session so no auth_token remains."""
        user = UserFactory(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)
        session = client.session
        session['auth_token'] = token.key
        session.save()

        client.delete('/users/logout.json', HTTP_AUTHORIZATION=f'Token {token.key}')

        assert 'auth_token' not in client.session

    def test_post_returns_method_not_allowed(self, client):
        """Test that POST to the logout endpoint returns 405 Method Not Allowed."""
        user = UserFactory(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)

        response = client.post(
            '/users/logout.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert response.status_code == 405

    def test_revokes_token_via_session_cookie(self, client):
        """Test that logout works for cookie-only users (no Authorization header)."""
        user = UserFactory(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)
        session = client.session
        session['auth_token'] = token.key
        session.save()

        response = client.delete('/users/logout.json')

        assert response.status_code == 204
        assert not Token.objects.filter(user=user).exists()
