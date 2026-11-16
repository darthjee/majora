"""Tests for the shared proxy-trust helper."""

import logging
from unittest.mock import patch

from django.test import RequestFactory, SimpleTestCase

from common.proxy_trust import (
    PROXY_ENFORCE_WITHOUT_SECRET,
    enforce_enabled,
    has_valid_proxy_secret,
    is_via_proxy,
    warn_if_enforce_without_secret,
)

SECRET = 'shh-secret'


class TestProxyTrust(SimpleTestCase):
    """Tests for `is_via_proxy` and `has_valid_proxy_secret`."""

    def _request(self, **headers):
        """Build a request with the given META entries."""
        return RequestFactory().get('/', **headers)

    def test_empty_secret_is_via_proxy(self):
        """An empty secret means every request is trusted."""
        assert is_via_proxy(self._request()) is True

    def test_empty_secret_has_no_valid_secret(self):
        """With an empty secret no header is valid."""
        request = self._request(HTTP_X_PROXY_SECRET='anything')
        assert has_valid_proxy_secret(request) is False

    def test_matching_secret(self):
        """A matching header is via proxy."""
        with patch.dict('os.environ', {'PROXY_SECRET': SECRET}):
            assert is_via_proxy(self._request(HTTP_X_PROXY_SECRET=SECRET)) is True

    def test_missing_header(self):
        """A missing header is untrusted when a secret is set."""
        with patch.dict('os.environ', {'PROXY_SECRET': SECRET}):
            assert is_via_proxy(self._request()) is False

    def test_wrong_header(self):
        """A wrong header is untrusted."""
        with patch.dict('os.environ', {'PROXY_SECRET': SECRET}):
            assert is_via_proxy(self._request(HTTP_X_PROXY_SECRET='nope')) is False

    def test_non_ascii_header(self):
        """A non-ASCII header is untrusted and does not raise."""
        with patch.dict('os.environ', {'PROXY_SECRET': SECRET}):
            assert is_via_proxy(self._request(HTTP_X_PROXY_SECRET='sécret')) is False

    def test_enforce_enabled_values(self):
        """Only `true` (any case) enables enforcement."""
        cases = {'true': True, 'TRUE': True, 'false': False, '': False, 'yes': False}
        for value, expected in cases.items():
            with self.subTest(value=value), patch.dict('os.environ', {'PROXY_ENFORCE': value}):
                assert enforce_enabled() is expected

    def test_enforce_unset(self):
        """Unset means enforcement is off."""
        assert enforce_enabled() is False


class TestEnforceWarning(SimpleTestCase):
    """Tests for the startup warning about enforcement without a secret."""

    def _warn(self, env):
        """Run the warning check with `env` and return the `common` logger records."""
        with patch.dict('os.environ', env), self.assertLogs('common', logging.DEBUG) as logs:
            logging.getLogger('common').debug('sentinel')
            warn_if_enforce_without_secret()
        return [r for r in logs.records if r.levelno == logging.WARNING]

    def test_warns_without_secret(self):
        """Enforcement on and no secret logs a warning."""
        records = self._warn({'PROXY_ENFORCE': 'true'})
        assert [r.getMessage() for r in records] == [PROXY_ENFORCE_WITHOUT_SECRET]

    def test_no_warning_with_secret(self):
        """Enforcement with a secret does not warn, nor leak the secret."""
        records = self._warn({'PROXY_ENFORCE': 'true', 'PROXY_SECRET': SECRET})
        assert records == []

    def test_no_warning_when_off(self):
        """No enforcement, no warning."""
        assert self._warn({}) == []
