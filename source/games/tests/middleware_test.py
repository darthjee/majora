"""Tests for CacheControlMiddleware."""

import pytest
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from games.models import Game


@pytest.mark.django_db
class TestCacheControlMiddlewareAnonymous:
    """Cache-Control header for unauthenticated requests."""

    def test_adds_public_cache_control_header(self, client):
        """Unauthenticated requests to a regular endpoint get public Cache-Control."""
        Game.objects.create(name='Test Game', game_slug='test-game')
        response = client.get('/games.json')
        assert 'Cache-Control' in response
        assert response['Cache-Control'] == 'public, max-age=3600'

    def test_uses_custom_anonymous_max_age(self, client, monkeypatch):
        """Custom MAJORA_CACHE_CONTROL_ANONYMOUS_SECONDS is reflected in the header."""
        monkeypatch.setenv('MAJORA_CACHE_CONTROL_ANONYMOUS_SECONDS', '600')
        Game.objects.create(name='Test Game', game_slug='test-game')
        response = client.get('/games.json')
        assert response['Cache-Control'] == 'public, max-age=600'


@pytest.mark.django_db
class TestCacheControlMiddlewareAuthenticated:
    """Cache-Control header for authenticated requests."""

    def test_adds_private_cache_control_header(self, client):
        """Authenticated requests to a regular endpoint get private Cache-Control."""
        user = User.objects.create_user(username='tester', password='secret')
        token = Token.objects.create(user=user)
        client.credentials = None  # ensure we use header-based auth
        response = client.get(
            '/games.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert 'Cache-Control' in response
        assert response['Cache-Control'] == 'private, max-age=10'

    def test_uses_custom_authenticated_max_age(self, client, monkeypatch):
        """Custom MAJORA_CACHE_CONTROL_AUTHENTICATED_SECONDS is reflected in the header."""
        monkeypatch.setenv('MAJORA_CACHE_CONTROL_AUTHENTICATED_SECONDS', '30')
        user = User.objects.create_user(username='tester2', password='secret')
        token = Token.objects.create(user=user)
        response = client.get(
            '/games.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response['Cache-Control'] == 'private, max-age=30'


@pytest.mark.django_db
class TestCacheControlMiddlewareSkipCache:
    """Middleware sets Cache-Control: no-store for responses with X-Skip-Cache: true."""

    def test_no_store_cache_control_when_x_skip_cache_present(self, client):
        """Responses with X-Skip-Cache: true receive Cache-Control: no-store."""
        user = User.objects.create_user(username='writer', password='secret')
        token = Token.objects.create(user=user)
        game = Game.objects.create(name='Skip Game', game_slug='skip-game')
        # The game-access endpoint sets X-Skip-Cache: true
        response = client.get(
            f'/games/{game.game_slug}/access.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert 'X-Skip-Cache' in response
        assert response['X-Skip-Cache'] == 'true'
        assert response['Cache-Control'] == 'no-store'


@pytest.mark.django_db
class TestCacheControlMiddlewareHealthCheck:
    """Middleware skips the health check endpoint."""

    def test_no_cache_control_for_health_endpoint(self, client):
        """GET /health.json does not receive a Cache-Control header."""
        response = client.get('/health.json')
        assert response.status_code == 200
        assert 'Cache-Control' not in response


@pytest.mark.django_db
class TestCacheControlMiddlewareErrorResponses:
    """Middleware sets no-store on non-2xx responses."""

    def test_401_response_gets_no_store(self, client):
        """Unauthenticated write requests receive Cache-Control: no-store."""
        game = Game.objects.create(name='Test Game', game_slug='test-game')
        response = client.patch(
            f'/games/{game.game_slug}.json',
            data='{"name": "Updated"}',
            content_type='application/json',
        )
        assert response.status_code == 401
        assert response['Cache-Control'] == 'no-store'
