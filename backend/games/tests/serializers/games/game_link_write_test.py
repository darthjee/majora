"""Tests for the GameLinkWriteSerializer."""

import pytest

from games.serializers import GameLinkWriteSerializer


@pytest.mark.django_db
class TestGameLinkWriteSerializer:
    """Tests for the GameLinkWriteSerializer."""

    def test_valid_with_only_url(self):
        """Test that a payload with only a url is valid."""
        serializer = GameLinkWriteSerializer(data={'url': 'http://example.com'})
        assert serializer.is_valid()

    def test_id_is_optional(self):
        """Test that omitting id is valid (a new link)."""
        serializer = GameLinkWriteSerializer(data={'url': 'http://example.com'})
        assert serializer.is_valid()
        assert 'id' not in serializer.validated_data

    def test_text_is_optional(self):
        """Test that omitting text is valid."""
        serializer = GameLinkWriteSerializer(data={'url': 'http://example.com'})
        assert serializer.is_valid()

    def test_link_type_blank_is_allowed(self):
        """Test that an empty link_type is valid."""
        serializer = GameLinkWriteSerializer(
            data={'url': 'http://example.com', 'link_type': ''}
        )
        assert serializer.is_valid()

    def test_delete_defaults_to_false(self):
        """Test that delete defaults to False when omitted."""
        serializer = GameLinkWriteSerializer(data={'url': 'http://example.com'})
        assert serializer.is_valid()
        assert serializer.validated_data['delete'] is False

    def test_url_is_required_when_not_deleting(self):
        """Test that a missing url is invalid unless delete is true."""
        serializer = GameLinkWriteSerializer(data={'text': 'Loot table'})
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_url_is_not_required_when_deleting(self):
        """Test that a missing url is valid when delete is true."""
        serializer = GameLinkWriteSerializer(data={'id': 1, 'delete': True})
        assert serializer.is_valid()

    def test_id_is_required_when_deleting(self):
        """Test that a missing id is invalid when delete is true."""
        serializer = GameLinkWriteSerializer(data={'delete': True})
        assert not serializer.is_valid()
        assert 'id' in serializer.errors

    def test_ftp_scheme_url_is_rejected(self):
        """Test that an `ftp:` scheme url is rejected at is_valid() time."""
        serializer = GameLinkWriteSerializer(data={'url': 'ftp://example.com'})
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_ftps_scheme_url_is_rejected(self):
        """Test that an `ftps:` scheme url is rejected at is_valid() time."""
        serializer = GameLinkWriteSerializer(data={'url': 'ftps://example.com'})
        assert not serializer.is_valid()
        assert 'url' in serializer.errors
