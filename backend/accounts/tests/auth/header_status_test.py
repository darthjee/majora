"""Tests for the header_status endpoint (Header's narrow login-status payload)."""

import json

import pytest
from django.utils.crypto import get_random_string
from rest_framework.authtoken.models import Token

from accounts.models import CacheToken, UserProfile
from games.tests.factories import UserFactory, UserProfileFactory

TEST_PASSWORD = get_random_string(20)


@pytest.mark.django_db
class TestHeaderStatusView:
    """Tests for the header_status endpoint."""

    def test_returns_logged_out_for_missing_token(self, client):
        """Test that a missing Authorization header reports logged_in false."""
        response = client.get('/users/header_status.json')

        assert response.status_code == 200
        assert json.loads(response.content) == {'logged_in': False}

    def test_returns_logged_out_for_invalid_token(self, client):
        """Test that an invalid token reports logged_in false instead of 401."""
        response = client.get(
            '/users/header_status.json',
            HTTP_AUTHORIZATION='Token garbage-token-value',
        )

        assert response.status_code == 200
        assert json.loads(response.content) == {'logged_in': False}

    def test_returns_pending_status_for_pending_user(self, client):
        """Test that a pending user's valid token reports the dedicated pending payload."""
        user = UserFactory(username='alice', password=TEST_PASSWORD)
        UserProfileFactory(user=user, status=UserProfile.STATUS_PENDING)
        token = Token.objects.create(user=user)

        response = client.get(
            '/users/header_status.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert response.status_code == 200
        data = json.loads(response.content)
        assert data == {'logged_in': False, 'status': 'pending'}
        assert 'is_staff' not in data
        assert 'is_superuser' not in data
        assert 'cache_token' not in data

    def test_returns_plain_logged_out_for_denied_user(self, client):
        """Test that a denied user's valid token reports a plain logged_in false (no status)."""
        user = UserFactory(username='alice', password=TEST_PASSWORD)
        UserProfileFactory(user=user, status=UserProfile.STATUS_DENIED)
        token = Token.objects.create(user=user)

        response = client.get(
            '/users/header_status.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert response.status_code == 200
        assert json.loads(response.content) == {'logged_in': False}

    def test_returns_narrow_payload_for_approved_non_staff_user(self, client):
        """Test that an approved, non-staff/non-superuser gets the narrow logged-in payload."""
        user = UserFactory(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)

        response = client.get(
            '/users/header_status.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert response.status_code == 200
        data = json.loads(response.content)
        cache_token = data.pop('cache_token')
        assert data == {
            'logged_in': True,
            'is_superuser': False,
            'is_staff': False,
            'settings': {'favorite_language': 'en'},
        }
        assert CacheToken.objects.filter(key=cache_token, user=user).exists()
        assert 'username' not in json.loads(response.content)
        assert 'user_id' not in json.loads(response.content)

    def test_omits_token_for_header_token_authenticated_request(self, client):
        """Test that token-auth (Authorization header) logged-in responses omit `token`."""
        user = UserFactory(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)

        response = client.get(
            '/users/header_status.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert response.status_code == 200
        assert 'token' not in json.loads(response.content)

    def test_includes_token_for_session_authenticated_request(self, client):
        """Test that session-auth logged-in responses include `token` matching the session."""
        user = UserFactory(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)
        session = client.session
        session['auth_token'] = token.key
        session.save()

        response = client.get('/users/header_status.json')

        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['token'] == token.key

    def test_omits_token_for_anonymous_request(self, client):
        """Test that the anonymous logged-out response omits `token`."""
        response = client.get('/users/header_status.json')

        assert 'token' not in json.loads(response.content)

    def test_omits_token_for_pending_user(self, client):
        """Test that a pending user's response omits `token`."""
        user = UserFactory(username='alice', password=TEST_PASSWORD)
        UserProfileFactory(user=user, status=UserProfile.STATUS_PENDING)
        token = Token.objects.create(user=user)

        response = client.get(
            '/users/header_status.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert 'token' not in json.loads(response.content)

    def test_omits_token_for_denied_user(self, client):
        """Test that a denied user's response omits `token`."""
        user = UserFactory(username='alice', password=TEST_PASSWORD)
        UserProfileFactory(user=user, status=UserProfile.STATUS_DENIED)
        token = Token.objects.create(user=user)

        response = client.get(
            '/users/header_status.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert 'token' not in json.loads(response.content)

    def test_returns_is_staff_and_is_superuser_true_for_staff_superuser(self, client):
        """Test that a staff/superuser reflects both flags as true."""
        user = UserFactory(username='admin', password=TEST_PASSWORD)
        user.is_staff = True
        user.is_superuser = True
        user.save()
        token = Token.objects.create(user=user)

        response = client.get(
            '/users/header_status.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )

        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['is_staff'] is True
        assert data['is_superuser'] is True

    def test_response_has_skip_cache_header(self, client):
        """Test that the response sets X-Skip-Cache: true."""
        response = client.get('/users/header_status.json')

        assert response['X-Skip-Cache'] == 'true'

    def test_repeated_calls_return_the_same_cache_token(self, client):
        """Test that a second call for the same user reuses the same cache_token."""
        user = UserFactory(username='alice', password=TEST_PASSWORD)
        token = Token.objects.create(user=user)
        session = client.session
        session['auth_token'] = token.key
        session.save()

        first = json.loads(client.get('/users/header_status.json').content)
        second = json.loads(client.get('/users/header_status.json').content)

        assert first['cache_token'] == second['cache_token']
        assert CacheToken.objects.filter(user=user).count() == 1
