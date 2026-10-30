"""Tests for the DeviceAuthorizationToken issuer."""

from datetime import datetime, timezone

import pytest

from accounts.device_authorization_token import DeviceAuthorizationToken
from accounts.models import AuthorizationRequest
from accounts.serializers.api_token.create import NAME_MAX_LENGTH

NOW = datetime(2026, 10, 29, 12, 0, tzinfo=timezone.utc)


class TestDeviceAuthorizationTokenName:
    """Tests for DeviceAuthorizationToken.name."""

    def _name(self, browser):
        """Return the generated name for a request from `browser`."""
        authorization_request = AuthorizationRequest(browser=browser, scopes=['games:read'])
        return DeviceAuthorizationToken(authorization_request).name(NOW)

    def test_joins_the_date_and_browser(self):
        """Test that the name carries the issuing date and the browser."""
        assert self._name('Firefox') == 'Device authorization 2026-10-29 — Firefox'

    def test_blank_browser_is_just_the_date(self):
        """Test that a blank browser leaves only the date part."""
        assert self._name('') == 'Device authorization 2026-10-29'

    @pytest.mark.parametrize('length', [NAME_MAX_LENGTH, 255])
    def test_truncates_to_the_token_name_limit(self, length):
        """Test that a long browser is cut to the token name limit."""
        assert len(self._name('x' * length)) == NAME_MAX_LENGTH
