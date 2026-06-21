"""Tests for authentication endpoints (login, register, logout)."""

import json

import pytest
from django.contrib.auth.models import User
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


@pytest.mark.django_db
class TestRegisterView:
    """Tests for the register endpoint."""

    def test_creates_user(self, client):
        """Test that a new user is created."""
        response = client.post(
            '/users/register.json',
            data=json.dumps(
                {'username': 'bob', 'password': TEST_PASSWORD, 'email': 'bob@example.com'}
            ),
            content_type='application/json',
        )
        assert response.status_code == 201
        assert User.objects.filter(username='bob').exists()

    def test_rejects_duplicate_username(self, client):
        """Test that registering an existing username fails."""
        User.objects.create_user(username='bob', password=TEST_PASSWORD)
        response = client.post(
            '/users/register.json',
            data=json.dumps({'username': 'bob', 'password': TEST_PASSWORD}),
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_rejects_missing_password(self, client):
        """Test that registering without a password fails."""
        response = client.post(
            '/users/register.json',
            data=json.dumps({'username': 'bob'}),
            content_type='application/json',
        )
        assert response.status_code == 400


@pytest.mark.django_db
class TestLogoutView:
    """Tests for the logout endpoint."""

    def test_revokes_token(self, client):
        """Test that logout deletes the user's token."""
        user = User.objects.create_user(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)

        response = client.post(
            '/users/logout.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert response.status_code == 204
        assert not Token.objects.filter(user=user).exists()

    def test_requires_authentication(self, client):
        """Test that logout without a token is rejected."""
        response = client.post('/users/logout.json')
        assert response.status_code == 401

    def test_subsequent_request_with_deleted_token_fails(self, client):
        """Test that a deleted token can no longer authenticate."""
        user = User.objects.create_user(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)

        client.post('/users/logout.json', HTTP_AUTHORIZATION=f'Token {token.key}')
        response = client.post('/users/logout.json', HTTP_AUTHORIZATION=f'Token {token.key}')

        assert response.status_code == 401


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
        assert json.loads(response.content) == {'logged_in': True, 'username': 'alice'}

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
