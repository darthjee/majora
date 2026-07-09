"""Tests for the CharacterLinkWriteSerializer."""

import pytest

from games.serializers import CharacterLinkWriteSerializer


@pytest.mark.django_db
class TestCharacterLinkWriteSerializer:
    """Tests for the CharacterLinkWriteSerializer."""

    def test_valid_with_only_url(self):
        """Test that a payload with only a url is valid."""
        serializer = CharacterLinkWriteSerializer(data={'url': 'http://example.com'})
        assert serializer.is_valid()

    def test_id_is_optional(self):
        """Test that omitting id is valid (a new link)."""
        serializer = CharacterLinkWriteSerializer(data={'url': 'http://example.com'})
        assert serializer.is_valid()
        assert 'id' not in serializer.validated_data

    def test_text_is_optional(self):
        """Test that omitting text is valid."""
        serializer = CharacterLinkWriteSerializer(data={'url': 'http://example.com'})
        assert serializer.is_valid()

    def test_link_type_blank_is_allowed(self):
        """Test that an empty link_type is valid."""
        serializer = CharacterLinkWriteSerializer(
            data={'url': 'http://example.com', 'link_type': ''}
        )
        assert serializer.is_valid()

    def test_delete_defaults_to_false(self):
        """Test that delete defaults to False when omitted."""
        serializer = CharacterLinkWriteSerializer(data={'url': 'http://example.com'})
        assert serializer.is_valid()
        assert serializer.validated_data['delete'] is False

    def test_url_is_required_when_not_deleting(self):
        """Test that a missing url is invalid unless delete is true."""
        serializer = CharacterLinkWriteSerializer(data={'text': 'Loot table'})
        assert not serializer.is_valid()
        assert 'url' in serializer.errors

    def test_url_is_not_required_when_deleting(self):
        """Test that a missing url is valid when delete is true."""
        serializer = CharacterLinkWriteSerializer(data={'id': 1, 'delete': True})
        assert serializer.is_valid()
