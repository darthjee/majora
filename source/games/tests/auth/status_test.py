"""Tests for the status endpoint (login status and Cache-Control header)."""

import json

import pytest
from django.contrib.auth.models import User
from django.utils.crypto import get_random_string
from rest_framework.authtoken.models import Token

TEST_PASSWORD = get_random_string(20)


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
            'is_superuser': False,
            'settings': {'favorite_language': 'en'},
        }

    def test_returns_is_superuser_false_for_regular_user(self, client):
        """Test that a non-superuser's status response includes is_superuser false."""
        user = User.objects.create_user(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)

        response = client.get(
            '/users/status.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert response.status_code == 200
        assert json.loads(response.content)['is_superuser'] is False

    def test_returns_is_superuser_true_for_superuser(self, client):
        """Test that a superuser's status response includes is_superuser true."""
        user = User.objects.create_user(username='admin', password=TEST_PASSWORD)
        user.is_superuser = True
        user.save()
        token = Token.objects.create(user=user)

        response = client.get(
            '/users/status.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert response.status_code == 200
        assert json.loads(response.content)['is_superuser'] is True

    def test_logged_out_response_has_no_is_superuser(self, client):
        """Test that the logged-out status response does not include is_superuser."""
        response = client.get('/users/status.json')

        assert response.status_code == 200
        data = json.loads(response.content)
        assert data == {'logged_in': False}
        assert 'is_superuser' not in data

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
class TestStatusViewCacheControl:

    """Cache-Control header for the status endpoint."""

    def test_unauthenticated_status_returns_no_store(self, client):
        """Unauthenticated GET /users/status.json must carry Cache-Control: no-store."""
        response = client.get('/users/status.json')
        assert response['Cache-Control'] == 'no-store'

    def test_authenticated_status_returns_no_store(self, client):
        """Authenticated GET /users/status.json must carry Cache-Control: no-store."""
        user = User.objects.create_user(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)
        response = client.get(
            '/users/status.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response['Cache-Control'] == 'no-store'
