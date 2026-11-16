"""Tests for `ProxyTrustMiddleware`."""

import json
from unittest.mock import patch

from django.conf import settings
from django.test import TestCase, override_settings

from domains.tests.factories import DomainConfigurationFactory, DomainFactory

SECRET = 'shh-secret'
FORWARDED = {'HTTP_HOST': 'internal-backend', 'HTTP_X_FORWARDED_HOST': 'tenant.example.com'}


@override_settings(ALLOWED_HOSTS=['*'])
class TestProxyTrustMiddleware(TestCase):
    """Tests for the proxy-trust middleware through real routes."""

    @classmethod
    def setUpTestData(cls):
        """Create a registered domain with a custom title."""
        cls.configuration = DomainConfigurationFactory(title='Tenant Title')
        DomainFactory(domain='tenant.example.com', domain_group=cls.configuration.domain_group)

    def _get(self, path, secret=None, **extra):
        """GET `path`, optionally sending the proxy secret header."""
        if secret is not None:
            extra['HTTP_X_PROXY_SECRET'] = secret
        return self.client.get(path, **extra)

    def _title(self, **kwargs):
        """Return the branding title served for `/domain/config.json`."""
        return json.loads(self._get('/domain/config.json', **FORWARDED, **kwargs).content)['title']

    def test_first_in_middleware(self):
        """The proxy-trust middleware is listed first."""
        assert settings.MIDDLEWARE[0] == 'common.middleware.ProxyTrustMiddleware'

    def test_empty_secret_honors_forwarded_host(self):
        """With no secret configured, X-Forwarded-Host is honored."""
        assert self._title() == 'Tenant Title'

    def test_matching_secret_honors_forwarded_host(self):
        """A matching secret keeps X-Forwarded-Host."""
        with patch.dict('os.environ', {'PROXY_SECRET': SECRET}):
            assert self._title(secret=SECRET) == 'Tenant Title'

    def test_missing_secret_ignores_forwarded_host(self):
        """A missing header drops X-Forwarded-Host but still serves the request."""
        with patch.dict('os.environ', {'PROXY_SECRET': SECRET}):
            assert self._title() == 'Majora'

    def test_wrong_secret_ignores_forwarded_host(self):
        """A wrong header drops X-Forwarded-Host."""
        with patch.dict('os.environ', {'PROXY_SECRET': SECRET}):
            assert self._title(secret='wrong') == 'Majora'

    def test_games_json_not_recognized_when_untrusted(self):
        """`/games.json` cannot resolve the domain from a spoofed X-Forwarded-Host."""
        with patch.dict('os.environ', {'PROXY_SECRET': SECRET}):
            response = self._get('/games.json', **FORWARDED)
        assert response.status_code == 404

    def test_enforce_rejects_untrusted(self):
        """With enforcement on, an untrusted request gets a 403 with no-store."""
        with patch.dict('os.environ', {'PROXY_SECRET': SECRET, 'PROXY_ENFORCE': 'TRUE'}):
            response = self._get('/games.json')
        assert response.status_code == 403
        assert json.loads(response.content) == {'detail': 'Forbidden'}
        assert response['Cache-Control'] == 'no-store'

    def test_enforce_exempts_ready(self):
        """`/ready.json` is exempt from enforcement."""
        with patch.dict('os.environ', {'PROXY_SECRET': SECRET, 'PROXY_ENFORCE': 'true'}):
            assert self._get('/ready.json').status_code == 200

    def test_enforce_exemption_is_exact(self):
        """`/ready.json/` does not get the exemption."""
        with patch.dict('os.environ', {'PROXY_SECRET': SECRET, 'PROXY_ENFORCE': 'true'}):
            assert self._get('/ready.json/').status_code == 403

    def test_enforce_allows_trusted(self):
        """A trusted request is served with enforcement on."""
        with patch.dict('os.environ', {'PROXY_SECRET': SECRET, 'PROXY_ENFORCE': 'true'}):
            assert self._get('/ready.json', secret=SECRET).status_code == 200
            assert self._get('/games.json', secret=SECRET, **FORWARDED).status_code == 200

    def test_enforce_without_secret_is_noop(self):
        """Enforcement with an empty secret rejects nothing."""
        with patch.dict('os.environ', {'PROXY_ENFORCE': 'true'}):
            assert self._get('/games.json').status_code != 403
