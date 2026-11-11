"""Tests for the common.client_ip module."""

import logging

import pytest
from django.test import RequestFactory

from common.client_ip import client_ip, proxy_secret, warn_if_proxy_secret_missing

SECRET = 'tent-secret'
WARNING_MESSAGE = (
    'PROXY_SECRET is not set: X-Forwarded-For is ignored and client IPs fall back to REMOTE_ADDR'
)


def _request(**meta):
    """Build a fake GET request with `REMOTE_ADDR` 9.9.9.9 plus the given META entries."""
    return RequestFactory().get('/fake/', REMOTE_ADDR='9.9.9.9', **meta)


class TestProxySecret:
    """Tests for proxy_secret()."""

    def test_returns_empty_string_when_unset(self, monkeypatch):
        """Test that the secret defaults to '' when PROXY_SECRET is unset."""
        monkeypatch.delenv('PROXY_SECRET', raising=False)
        assert proxy_secret() == ''

    def test_reads_value_from_env(self, monkeypatch):
        """Test that the secret is read from PROXY_SECRET."""
        monkeypatch.setenv('PROXY_SECRET', SECRET)
        assert proxy_secret() == SECRET


class TestWarnIfProxySecretMissing:
    """Tests for warn_if_proxy_secret_missing()."""

    @pytest.fixture(autouse=True)
    def _capture_common_logs(self, caplog):
        """Attach caplog to the (non-propagating) `common` logger for the test."""
        common_logger = logging.getLogger('common')
        common_logger.addHandler(caplog.handler)
        caplog.set_level(logging.WARNING, logger='common')
        self.caplog = caplog
        yield
        common_logger.removeHandler(caplog.handler)

    def test_warns_in_production_when_secret_unset(self, settings, monkeypatch):
        """Test that one WARNING with the contract message is logged on `common`."""
        settings.DEBUG = False
        monkeypatch.delenv('PROXY_SECRET', raising=False)
        warn_if_proxy_secret_missing()
        assert self.caplog.record_tuples == [('common', logging.WARNING, WARNING_MESSAGE)]

    def test_warns_in_production_when_secret_empty(self, settings, monkeypatch):
        """Test that an empty PROXY_SECRET is treated as missing."""
        settings.DEBUG = False
        monkeypatch.setenv('PROXY_SECRET', '')
        warn_if_proxy_secret_missing()
        assert self.caplog.record_tuples == [('common', logging.WARNING, WARNING_MESSAGE)]

    def test_silent_in_production_when_secret_set(self, settings, monkeypatch):
        """Test that nothing is logged, and the secret never appears, when it is set."""
        settings.DEBUG = False
        monkeypatch.setenv('PROXY_SECRET', SECRET)
        warn_if_proxy_secret_missing()
        assert self.caplog.records == []
        assert SECRET not in self.caplog.text

    def test_silent_in_debug_when_secret_unset(self, settings, monkeypatch):
        """Test that nothing is logged outside production settings."""
        settings.DEBUG = True
        monkeypatch.delenv('PROXY_SECRET', raising=False)
        warn_if_proxy_secret_missing()
        assert self.caplog.records == []


class TestClientIp:
    """Tests for client_ip()."""

    def test_trusted_single_value(self, monkeypatch):
        """Test that a trusted single X-Forwarded-For value is returned."""
        monkeypatch.setenv('PROXY_SECRET', SECRET)
        request = _request(HTTP_X_PROXY_SECRET=SECRET, HTTP_X_FORWARDED_FOR='1.2.3.4')
        assert client_ip(request) == '1.2.3.4'

    def test_trusted_multi_value_leftmost_wins(self, monkeypatch):
        """Test that the leftmost entry of a trusted multi-value header is returned."""
        monkeypatch.setenv('PROXY_SECRET', SECRET)
        request = _request(
            HTTP_X_PROXY_SECRET=SECRET, HTTP_X_FORWARDED_FOR='1.2.3.4, 5.6.7.8, 10.0.0.1'
        )
        assert client_ip(request) == '1.2.3.4'

    def test_trusted_with_whitespace(self, monkeypatch):
        """Test that surrounding whitespace is stripped from the trusted entry."""
        monkeypatch.setenv('PROXY_SECRET', SECRET)
        request = _request(HTTP_X_PROXY_SECRET=SECRET, HTTP_X_FORWARDED_FOR='  1.2.3.4  ,5.6.7.8')
        assert client_ip(request) == '1.2.3.4'

    def test_trusted_invalid_value_falls_back(self, monkeypatch):
        """Test that an invalid trusted entry falls back to REMOTE_ADDR."""
        monkeypatch.setenv('PROXY_SECRET', SECRET)
        request = _request(HTTP_X_PROXY_SECRET=SECRET, HTTP_X_FORWARDED_FOR='not-an-ip')
        assert client_ip(request) == '9.9.9.9'

    def test_trusted_without_forwarded_header_falls_back(self, monkeypatch):
        """Test that a trusted request without X-Forwarded-For uses REMOTE_ADDR."""
        monkeypatch.setenv('PROXY_SECRET', SECRET)
        request = _request(HTTP_X_PROXY_SECRET=SECRET)
        assert client_ip(request) == '9.9.9.9'

    def test_wrong_secret_ignores_forged_header(self, monkeypatch):
        """Test that a wrong secret makes the forged X-Forwarded-For be ignored."""
        monkeypatch.setenv('PROXY_SECRET', SECRET)
        request = _request(HTTP_X_PROXY_SECRET='guess', HTTP_X_FORWARDED_FOR='1.2.3.4')
        assert client_ip(request) == '9.9.9.9'

    def test_non_ascii_secret_header_falls_back(self, monkeypatch):
        """Test that a non-ASCII X-Proxy-Secret falls back to REMOTE_ADDR instead of raising."""
        monkeypatch.setenv('PROXY_SECRET', SECRET)
        request = _request(HTTP_X_PROXY_SECRET='\xe9', HTTP_X_FORWARDED_FOR='1.2.3.4')
        assert client_ip(request) == '9.9.9.9'

    def test_missing_secret_header_ignores_forwarded(self, monkeypatch):
        """Test that a missing X-Proxy-Secret header makes X-Forwarded-For be ignored."""
        monkeypatch.setenv('PROXY_SECRET', SECRET)
        request = _request(HTTP_X_FORWARDED_FOR='1.2.3.4')
        assert client_ip(request) == '9.9.9.9'

    def test_secret_unset_ignores_forwarded(self, monkeypatch):
        """Test that X-Forwarded-For is ignored when PROXY_SECRET is unset, even with a header."""
        monkeypatch.delenv('PROXY_SECRET', raising=False)
        request = _request(HTTP_X_PROXY_SECRET='', HTTP_X_FORWARDED_FOR='1.2.3.4')
        assert client_ip(request) == '9.9.9.9'

    def test_secret_unset_ignores_any_sent_secret(self, monkeypatch):
        """Test that a sent secret is never trusted when PROXY_SECRET is unset."""
        monkeypatch.delenv('PROXY_SECRET', raising=False)
        request = _request(HTTP_X_PROXY_SECRET=SECRET, HTTP_X_FORWARDED_FOR='1.2.3.4')
        assert client_ip(request) == '9.9.9.9'

    def test_trusted_ipv6_value(self, monkeypatch):
        """Test that a trusted IPv6 X-Forwarded-For value is returned."""
        monkeypatch.setenv('PROXY_SECRET', SECRET)
        request = _request(HTTP_X_PROXY_SECRET=SECRET, HTTP_X_FORWARDED_FOR='2001:db8::1')
        assert client_ip(request) == '2001:db8::1'

    def test_returns_none_without_remote_addr(self, monkeypatch):
        """Test that None is returned when nothing trusted and REMOTE_ADDR is absent."""
        monkeypatch.delenv('PROXY_SECRET', raising=False)
        request = RequestFactory().get('/fake/')
        del request.META['REMOTE_ADDR']
        assert client_ip(request) is None
