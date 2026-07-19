"""Tests for the FrontendBaseUrl URL-builder class."""

import pytest

from games.url_builder import FrontendBaseUrl


class TestFrontendBaseUrl:
    """Tests for FrontendBaseUrl.build()."""

    @pytest.mark.parametrize(
        'raw_value,expected',
        [
            ('https://server.com:80', 'https://server.com:80'),
            ('https://server.com:80/', 'https://server.com:80'),
            ('https://server.com', 'https://server.com'),
            ('https://server.com/', 'https://server.com'),
            ('server.com', 'https://server.com'),
            ('server.com/', 'https://server.com'),
        ],
    )
    def test_normalizes_raw_value(self, raw_value, expected):
        """Test that every supported input format normalizes to the expected base URL."""
        assert FrontendBaseUrl(raw_value).build() == expected

    def test_defaults_to_frontend_base_url_setting(self, settings):
        """Test that the setting's value is used when no raw_value is given."""
        settings.FRONTEND_BASE_URL = 'server.com/'
        assert FrontendBaseUrl().build() == 'https://server.com'
