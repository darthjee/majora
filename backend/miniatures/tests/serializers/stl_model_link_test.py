"""Tests for the StlModelLinkSerializer."""

import pytest

from miniatures.serializers import StlModelLinkSerializer


@pytest.mark.django_db
class TestStlModelLinkSerializer:
    """Tests for the StlModelLinkSerializer."""

    def test_valid_with_text_and_url(self):
        """Test that a payload with text and a http(s) url is valid."""
        serializer = StlModelLinkSerializer(
            data={'text': 'Loot table', 'url': 'https://example.com'}
        )
        assert serializer.is_valid()

    def test_missing_url_returns_error(self):
        """Test that a missing url is invalid."""
        serializer = StlModelLinkSerializer(data={'text': 'Loot table'})
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_javascript_scheme_url_is_rejected(self):
        """Test that a `javascript:` scheme url is rejected."""
        serializer = StlModelLinkSerializer(
            data={'text': 'Loot table', 'url': 'javascript:alert(1)'}
        )
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_ftp_scheme_url_is_rejected(self):
        """Test that an `ftp:` scheme url is rejected at is_valid() time."""
        serializer = StlModelLinkSerializer(
            data={'text': 'Loot table', 'url': 'ftp://example.com'}
        )
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_ftps_scheme_url_is_rejected(self):
        """Test that an `ftps:` scheme url is rejected at is_valid() time."""
        serializer = StlModelLinkSerializer(
            data={'text': 'Loot table', 'url': 'ftps://example.com'}
        )
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_http_scheme_url_is_accepted(self):
        """Test that a legitimate `http:` scheme url is accepted."""
        serializer = StlModelLinkSerializer(
            data={'text': 'Loot table', 'url': 'http://example.com'}
        )
        assert serializer.is_valid()
