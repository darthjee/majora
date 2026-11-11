"""Tests for CacheControlMiddleware."""

import pytest
from django.conf import settings
from django.contrib.auth.models import AnonymousUser, User
from django.http import HttpResponse
from rest_framework.authtoken.models import Token

from domains.tests.factories import DomainFactory
from games.middleware import CacheControlMiddleware
from games.tests.factories import GameFactory, UserFactory
from majora_project.cache import memory_cache
from statistics import cookies

COOKIE_SETTING_MIDDLEWARES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'statistics.middleware.StatisticsSessionMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
)


def _view(status=200, cookie=False, deleted_cookie=False):
    """Return a stub view answering `status`, optionally setting or deleting a cookie."""
    def view(request):
        response = HttpResponse(status=status)
        if cookie:
            response.set_cookie('visitor', 'value')
        if deleted_cookie:
            response.delete_cookie('visitor')
        return response
    return view


def _anonymous_request(rf, path='/'):
    """Return a GET request for `path` resolved to an anonymous user."""
    request = rf.get(path)
    request.user = AnonymousUser()
    return request


class TestCacheControlMiddlewareCookies:
    """Anonymous-tier Cache-Control depending on the cookies a response sets."""

    def test_anonymous_success_with_cookie_is_private(self, rf):
        """An anonymous 2xx response that sets a cookie gets the private anonymous tier."""
        response = CacheControlMiddleware(_view(cookie=True))(_anonymous_request(rf))
        assert response['Cache-Control'] == 'private, max-age=3600'

    def test_anonymous_success_without_cookie_is_public(self, rf):
        """An anonymous 2xx response that sets no cookie keeps the public tier."""
        response = CacheControlMiddleware(_view())(_anonymous_request(rf))
        assert response['Cache-Control'] == 'public, max-age=3600'

    def test_anonymous_success_deleting_a_cookie_is_private(self, rf):
        """An anonymous 2xx response that deletes a cookie also sends Set-Cookie: private."""
        response = CacheControlMiddleware(_view(deleted_cookie=True))(_anonymous_request(rf))
        assert response['Cache-Control'] == 'private, max-age=3600'

    def test_permissions_path_with_cookie_is_private(self, rf):
        """A /permissions/ response that sets a cookie gets the private anonymous tier."""
        request = _anonymous_request(rf, '/permissions/game.json')
        response = CacheControlMiddleware(_view(cookie=True))(request)
        assert response['Cache-Control'] == 'private, max-age=3600'

    def test_permissions_path_without_cookie_is_public(self, rf):
        """A /permissions/ response that sets no cookie keeps the public tier."""
        request = _anonymous_request(rf, '/permissions/game.json')
        response = CacheControlMiddleware(_view())(request)
        assert response['Cache-Control'] == 'public, max-age=3600'

    def test_error_with_cookie_is_no_store(self, rf):
        """A non-2xx anonymous response that sets a cookie still gets no-store."""
        response = CacheControlMiddleware(_view(status=404, cookie=True))(_anonymous_request(rf))
        assert response['Cache-Control'] == 'no-store'

    def test_private_value_uses_custom_anonymous_max_age(self, rf, monkeypatch):
        """Custom MAJORA_CACHE_CONTROL_ANONYMOUS_SECONDS is reflected in the private value."""
        monkeypatch.setenv('MAJORA_CACHE_CONTROL_ANONYMOUS_SECONDS', '600')
        response = CacheControlMiddleware(_view(cookie=True))(_anonymous_request(rf))
        assert response['Cache-Control'] == 'private, max-age=600'

    def test_public_value_uses_custom_anonymous_max_age(self, rf, monkeypatch):
        """Custom MAJORA_CACHE_CONTROL_ANONYMOUS_SECONDS is reflected in the public value."""
        monkeypatch.setenv('MAJORA_CACHE_CONTROL_ANONYMOUS_SECONDS', '600')
        response = CacheControlMiddleware(_view())(_anonymous_request(rf))
        assert response['Cache-Control'] == 'public, max-age=600'

    def test_request_without_user_is_anonymous(self, rf):
        """A request stopped before `request.user` was set gets the anonymous tier."""
        response = CacheControlMiddleware(_view())(rf.get('/'))
        assert response['Cache-Control'] == 'public, max-age=3600'

    def test_failed_request_without_user_is_no_store(self, rf):
        """A failed request stopped before `request.user` was set gets no-store."""
        response = CacheControlMiddleware(_view(status=400))(rf.get('/'))
        assert response['Cache-Control'] == 'no-store'


class TestCacheControlMiddlewareOrder:
    """Position of CacheControlMiddleware in `settings.MIDDLEWARE`."""

    @pytest.mark.parametrize('cookie_middleware', COOKIE_SETTING_MIDDLEWARES)
    def test_listed_above_cookie_setting_middlewares(self, cookie_middleware):
        """CacheControlMiddleware is listed above every middleware that sets a cookie."""
        middleware = settings.MIDDLEWARE
        cache_control = middleware.index('games.middleware.CacheControlMiddleware')
        assert cache_control < middleware.index(cookie_middleware)


@pytest.mark.django_db
class TestCacheControlMiddlewareFullStackCookies:
    """Cache-Control of cookie-setting responses through the whole middleware stack."""

    def setup_method(self):
        """Clear the shared memory cache and register 'testserver' as a known domain."""
        memory_cache.clear()
        DomainFactory(domain='testserver')

    def test_tracked_anonymous_response_is_never_public(self, client):
        """A tracked anonymous response carries the statistics cookie and is private."""
        response = client.get('/games.json')
        assert cookies.COOKIE_NAME in response.cookies
        assert 'public' not in response['Cache-Control']
        assert response['Cache-Control'] == 'private, max-age=3600'

    def test_tracked_permissions_response_is_never_public(self, client):
        """A tracked /permissions/ response carries the statistics cookie and is private."""
        response = client.get('/permissions/game.json?role=dm')
        assert cookies.COOKIE_NAME in response.cookies
        assert response['Cache-Control'] == 'private, max-age=3600'

    def test_returning_visitor_response_is_never_public(self, client):
        """The statistics cookie is re-sent to a returning visitor, so it stays private."""
        client.get('/games.json')
        response = client.get('/games.json')
        assert cookies.COOKIE_NAME in response.cookies
        assert response['Cache-Control'] == 'private, max-age=3600'

    def test_anonymous_csrf_cookie_response_is_never_public(self, client, monkeypatch):
        """An anonymous page setting only the CSRF cookie (admin login) is private."""
        monkeypatch.setenv('STATISTICS_SKIP_SECRET', 'test-skip-secret')
        response = client.get(
            '/admin/login/', HTTP_X_STATISTICS_SKIP_SECRET='test-skip-secret',
        )
        assert response.status_code == 200
        assert set(response.cookies) == {settings.CSRF_COOKIE_NAME}
        assert response['Cache-Control'] == 'private, max-age=3600'

    def test_login_session_cookie_response_is_never_public(self, client):
        """A successful login sets the session cookie and is never public."""
        UserFactory(username='visitor', password='visitor-password')
        response = client.post(
            '/users/login.json',
            data='{"username": "visitor", "password": "visitor-password"}',
            content_type='application/json',
        )
        assert response.status_code == 200
        assert settings.SESSION_COOKIE_NAME in response.cookies
        assert 'public' not in response['Cache-Control']


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
        self.game_domain = DomainFactory(domain='testserver')

    def test_adds_anonymous_cache_control_header(self, client):
        """Unauthenticated requests to a regular endpoint get the anonymous max-age.

        The response carries the statistics cookie, so the tier is `private`, never `public`.
        """
        GameFactory(
            name='Test Game', game_slug='test-game',
            game_domain_groups=[self.game_domain.domain_group],
        )
        response = client.get('/games.json')
        assert 'Cache-Control' in response
        assert response['Cache-Control'] == 'private, max-age=3600'

    def test_uses_custom_anonymous_max_age(self, client, monkeypatch):
        """Custom MAJORA_CACHE_CONTROL_ANONYMOUS_SECONDS is reflected in the header."""
        monkeypatch.setenv('MAJORA_CACHE_CONTROL_ANONYMOUS_SECONDS', '600')
        GameFactory(
            name='Test Game', game_slug='test-game',
            game_domain_groups=[self.game_domain.domain_group],
        )
        response = client.get('/games.json')
        assert response['Cache-Control'] == 'private, max-age=600'


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
        DomainFactory(domain='testserver')

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

    def test_keeps_a_view_private_no_store(self, rf):
        """A skip-cache response whose view set `private, no-store` keeps that value."""
        def view(request):
            response = HttpResponse()
            response['X-Skip-Cache'] = 'true'
            response['Cache-Control'] = 'private, no-store'
            return response

        response = CacheControlMiddleware(view)(rf.get('/'))
        assert response['Cache-Control'] == 'private, no-store'

    def test_replaces_a_view_storable_value(self, rf):
        """A skip-cache response whose view set a storable value gets no-store."""
        def view(request):
            response = HttpResponse()
            response['X-Skip-Cache'] = 'true'
            response['Cache-Control'] = 'private, max-age=30'
            return response

        response = CacheControlMiddleware(view)(rf.get('/'))
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
    """Middleware forces the anonymous cache tier for the `/permissions/` path prefix.

    These responses carry the statistics cookie, so the anonymous tier is `private` here; the
    cookie-less `public` value is covered by `TestCacheControlMiddlewareCookies`.
    """

    def test_anonymous_tier_for_authenticated_caller(self, client):
        """An authenticated caller still gets the anonymous max-age on a /permissions/ route."""
        user = UserFactory(username='dm_user', password='secret')
        token = Token.objects.create(user=user)
        # Every /permissions/ route is role-simulated/identity-independent by construction.
        response = client.get(
            '/permissions/game.json?role=dm',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response['Cache-Control'] == 'private, max-age=3600'

    def test_anonymous_tier_for_anonymous_caller(self, client):
        """An anonymous caller also gets the anonymous max-age on a /permissions/ route."""
        response = client.get('/permissions/game.json?role=dm')
        assert response['Cache-Control'] == 'private, max-age=3600'

    def test_anonymous_tier_regardless_of_response_headers(self, client):
        """Any route under /permissions/ gets the anonymous tier, not just game.json."""
        response = client.get('/permissions/treasure.json')
        assert response['Cache-Control'] == 'private, max-age=3600'

    def test_public_for_authenticated_caller_without_cookie(self, rf):
        """Without a cookie, an authenticated caller gets `public` on a /permissions/ route."""
        request = rf.get('/permissions/game.json')
        request.user = User(username='dm_user')
        response = CacheControlMiddleware(_view())(request)
        assert response['Cache-Control'] == 'public, max-age=3600'
