"""Tests for the BearerNoCacheMiddleware class."""

import pytest
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.http import HttpResponse
from django.test import RequestFactory
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from accounts.middleware import BearerNoCacheMiddleware
from accounts.models import ApiToken
from domains.tests.factories import DomainFactory
from games.middleware import CacheControlMiddleware
from games.tests.factories import UserFactory
from majora_project.cache import memory_cache

ACCOUNT_URL = '/account/account.json'
GAMES_URL = '/games.json'
UNKNOWN_URL = '/does-not-exist/at-all.json'
BEARER_HEADERS = ['Bearer abc', 'bearer abc', 'BEARER abc', 'Bearer\tabc', 'Token x, Bearer y']
STATUSES = [200, 401, 403, 404, 500]


def _stub(status):
    """Return a `get_response` callable that answers with an empty response of `status`."""
    return lambda request: HttpResponse(status=status)


def _assert_no_cache(response):
    """Assert that `response` carries both Bearer no-cache headers."""
    assert response['X-Skip-Cache'] == 'true'
    assert response['Cache-Control'] == 'no-store'


def _assert_untouched(response):
    """Assert that `response` carries neither caching header."""
    assert not response.has_header('X-Skip-Cache')
    assert not response.has_header('Cache-Control')


class TestBearerNoCacheMiddlewareDirect:
    """Tests calling the middleware directly with stub responses."""

    def setup_method(self):
        """Set up a request factory."""
        self.factory = RequestFactory()

    def _call(self, status, **extra):
        """Run the middleware over a stub response of `status` for a GET with `extra`."""
        request = self.factory.get('/', **extra)
        return BearerNoCacheMiddleware(_stub(status))(request)

    @pytest.mark.parametrize('status', STATUSES)
    @pytest.mark.parametrize('header', BEARER_HEADERS)
    def test_bearer_responses_are_not_cacheable(self, header, status):
        """Test that every Bearer response gets both no-cache headers, whatever the status."""
        _assert_no_cache(self._call(status, HTTP_AUTHORIZATION=header))

    @pytest.mark.parametrize('header', ['Token abc', 'Basic abc', 'Bearerish abc', 'x bearer y'])
    def test_non_bearer_responses_are_untouched(self, header):
        """Test that non-Bearer Authorization values leave the response alone."""
        response = self._call(200, HTTP_AUTHORIZATION=header)
        _assert_untouched(response)

    def test_no_authorization_is_untouched(self):
        """Test that a request without Authorization leaves the response alone."""
        response = self._call(200)
        _assert_untouched(response)

    def test_forged_bearer_marker_is_ignored(self):
        """Test that a forged `X-Bearer-Request` header on a non-Bearer request does nothing."""
        response = self._call(200, HTTP_X_BEARER_REQUEST='true')
        _assert_untouched(response)


@pytest.mark.django_db
class TestBearerNoCacheMiddlewareChain:
    """Tests the middleware combined with CacheControlMiddleware in settings order."""

    def setup_method(self):
        """Set up a request factory and an authenticated user."""
        self.factory = RequestFactory()
        self.user = UserFactory(username='alice', password='secret-password')

    def _call(self, user, status=200, **extra):
        """Run both middlewares, in settings order, over a stub response of `status`."""
        request = self.factory.get('/', **extra)
        request.user = user
        return CacheControlMiddleware(BearerNoCacheMiddleware(_stub(status)))(request)

    def test_order_in_settings(self):
        """Test that BearerNoCacheMiddleware is listed after CacheControlMiddleware."""
        middleware = settings.MIDDLEWARE
        bearer = middleware.index('accounts.middleware.BearerNoCacheMiddleware')
        assert bearer > middleware.index('games.middleware.CacheControlMiddleware')

    def test_authenticated_bearer_keeps_no_store(self):
        """Test that an authenticated Bearer response is not turned into `private`."""
        _assert_no_cache(self._call(self.user, HTTP_AUTHORIZATION='Bearer abc'))

    def test_anonymous_bearer_keeps_no_store(self):
        """Test that an anonymous Bearer 200 is not turned into `public`."""
        _assert_no_cache(self._call(AnonymousUser(), HTTP_AUTHORIZATION='Bearer abc'))

    def test_bearer_500_keeps_no_store(self):
        """Test that a Bearer 500 gets both no-cache headers through the chain."""
        _assert_no_cache(self._call(self.user, status=500, HTTP_AUTHORIZATION='Bearer abc'))

    def test_anonymous_without_bearer_stays_public(self):
        """Test that a non-Bearer anonymous 200 keeps the public tier."""
        response = self._call(AnonymousUser(), HTTP_X_BEARER_REQUEST='true')
        assert response['Cache-Control'].startswith('public, ')
        assert not response.has_header('X-Skip-Cache')


@pytest.mark.django_db
class TestBearerNoCacheMiddlewareEndToEnd:
    """End-to-end tests through the full Django middleware stack."""

    def setup_method(self):
        """Set up a user owning one valid API token and one legacy token.

        `testserver` is registered so `/games.json` resolves as a regular endpoint.
        """
        memory_cache.clear()
        DomainFactory(domain='testserver')
        self.user = UserFactory(username='alice', password='secret-password')
        _, self.plain = ApiToken.objects.create_token(self.user, 'automation', ['games:read'])
        self.legacy = Token.objects.create(user=self.user)
        self.client = APIClient()

    def _get(self, url, header):
        """GET `url` with `header` as the Authorization value."""
        return self.client.get(url, HTTP_AUTHORIZATION=header)

    @pytest.mark.parametrize('scheme', ['Bearer', 'bearer', 'BEARER'])
    def test_invalid_bearer_401(self, scheme):
        """Test that a 401 to an invalid Bearer token is not cacheable."""
        response = self._get(ACCOUNT_URL, f'{scheme} mjr_nope_nope')
        assert response.status_code == 401
        _assert_no_cache(response)

    def test_valid_bearer_403(self):
        """Test that a 403 to a valid Bearer token on an undeclared view is not cacheable."""
        response = self._get(ACCOUNT_URL, f'Bearer {self.plain}')
        assert response.status_code == 403
        _assert_no_cache(response)

    def test_joined_bearer_header(self):
        """Test that a `Token x, Bearer y` header is treated as Bearer."""
        response = self._get(ACCOUNT_URL, f'Token {self.legacy.key}, Bearer {self.plain}')
        _assert_no_cache(response)

    def test_tab_separator(self):
        """Test that a tab-separated Bearer header is treated as Bearer."""
        _assert_no_cache(self._get(ACCOUNT_URL, f'Bearer\t{self.plain}'))

    def test_unknown_url_404(self):
        """Test that a Django-level 404 to a Bearer request is not cacheable."""
        response = self._get(UNKNOWN_URL, f'Bearer {self.plain}')
        assert response.status_code == 404
        _assert_no_cache(response)

    def test_legacy_token_keeps_private_tier(self):
        """Test that a legacy Token response keeps its private Cache-Control."""
        response = self._get(GAMES_URL, f'Token {self.legacy.key}')
        assert response.status_code == 200
        assert response['Cache-Control'].startswith('private, ')
        assert not response.has_header('X-Skip-Cache')

    def test_session_keeps_private_tier(self):
        """Test that a session response keeps its private Cache-Control."""
        session = self.client.session
        session['auth_token'] = self.legacy.key
        session.save()
        response = self.client.get(GAMES_URL, HTTP_X_BEARER_REQUEST='true')
        assert response.status_code == 200
        assert response['Cache-Control'].startswith('private, ')
        assert not response.has_header('X-Skip-Cache')
