"""Tests for CacheControlMiddleware."""

import pytest
from rest_framework.authtoken.models import Token

from games.tests.factories import GameDomainFactory, GameFactory, UserFactory
from majora_project.cache import memory_cache


@pytest.mark.django_db
class TestCacheControlMiddlewareAnonymous:
    """Cache-Control header for unauthenticated requests."""

    def setup_method(self):
        """Clear the shared memory cache and register 'testserver' as a known domain.

        `/games.json` is used here only as a stand-in "regular endpoint" to exercise the
        cache-control middleware, so it needs a registered domain matching the test
        client's default `Host: testserver` to resolve at all.
        """
        memory_cache.clear()
        self.game_domain = GameDomainFactory(domain='testserver')

    def test_adds_public_cache_control_header(self, client):
        """Unauthenticated requests to a regular endpoint get public Cache-Control."""
        GameFactory(
            name='Test Game', game_slug='test-game',
            game_domain_groups=[self.game_domain.game_domain_group],
        )
        response = client.get('/games.json')
        assert 'Cache-Control' in response
        assert response['Cache-Control'] == 'public, max-age=3600'

    def test_uses_custom_anonymous_max_age(self, client, monkeypatch):
        """Custom MAJORA_CACHE_CONTROL_ANONYMOUS_SECONDS is reflected in the header."""
        monkeypatch.setenv('MAJORA_CACHE_CONTROL_ANONYMOUS_SECONDS', '600')
        GameFactory(
            name='Test Game', game_slug='test-game',
            game_domain_groups=[self.game_domain.game_domain_group],
        )
        response = client.get('/games.json')
        assert response['Cache-Control'] == 'public, max-age=600'


@pytest.mark.django_db
class TestCacheControlMiddlewareAuthenticated:
    """Cache-Control header for authenticated requests."""

    def setup_method(self):
        """Clear the shared memory cache and register 'testserver' as a known domain.

        `/games.json` is used here only as a stand-in "regular endpoint" to exercise the
        cache-control middleware, so it needs a registered domain matching the test
        client's default `Host: testserver` to resolve at all.
        """
        memory_cache.clear()
        GameDomainFactory(domain='testserver')

    def test_adds_private_cache_control_header(self, client):
        """Authenticated requests to a regular endpoint get private Cache-Control."""
        user = UserFactory(username='tester', password='secret')
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
        user = UserFactory(username='tester2', password='secret')
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
        user = UserFactory(username='writer', password='secret')
        token = Token.objects.create(user=user)
        game = GameFactory(name='Skip Game', game_slug='skip-game')
        # The game-access endpoint sets X-Skip-Cache: true
        response = client.get(
            f'/games/{game.game_slug}/access.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert 'X-Skip-Cache' in response
        assert response['X-Skip-Cache'] == 'true'
        assert response['Cache-Control'] == 'no-store'

    def test_no_store_cache_control_for_ready_endpoint(self, client):
        """GET /ready.json sets X-Skip-Cache: true and receives Cache-Control: no-store."""
        response = client.get('/ready.json')
        assert response['X-Skip-Cache'] == 'true'
        assert response['Cache-Control'] == 'no-store'


@pytest.mark.django_db
class TestCacheControlMiddlewareErrorResponses:
    """Middleware sets no-store on non-2xx responses."""

    def test_401_response_gets_no_store(self, client):
        """Unauthenticated write requests receive Cache-Control: no-store."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        response = client.patch(
            f'/games/{game.game_slug}.json',
            data='{"name": "Updated"}',
            content_type='application/json',
        )
        assert response.status_code == 401
        assert response['Cache-Control'] == 'no-store'


@pytest.mark.django_db
class TestCacheControlMiddlewarePermissionsPrefix:
    """Middleware forces the public/anonymous cache tier for the `/permissions/` path prefix."""

    def test_public_cache_control_for_authenticated_caller(self, client):
        """An authenticated caller still gets public Cache-Control on a /permissions/ route."""
        user = UserFactory(username='dm_user', password='secret')
        token = Token.objects.create(user=user)
        # Every /permissions/ route is role-simulated/identity-independent by construction.
        response = client.get(
            '/permissions/game.json?role=dm',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response['Cache-Control'] == 'public, max-age=3600'

    def test_public_cache_control_for_anonymous_caller(self, client):
        """An anonymous caller also gets public Cache-Control on a /permissions/ route."""
        response = client.get('/permissions/game.json?role=dm')
        assert response['Cache-Control'] == 'public, max-age=3600'

    def test_public_cache_control_regardless_of_response_headers(self, client):
        """Any route under /permissions/ gets the public tier, not just game.json."""
        response = client.get('/permissions/treasure.json')
        assert response['Cache-Control'] == 'public, max-age=3600'
