"""Tests for the CharacterLinkSerializer."""

import pytest

from games.models import CharacterLink
from games.serializers import CharacterLinkSerializer
from games.tests.factories import CharacterFactory, GameFactory


@pytest.mark.django_db
class TestCharacterLinkSerializer:
    """Tests for the CharacterLinkSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Frodo', game=self.game)
        self.link = CharacterLink.objects.create(
            text='Official Wiki',
            url='http://example.com/wiki',
            character=self.character,
        )

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = CharacterLinkSerializer(self.link).data
        assert data['id'] == self.link.id

    def test_serializes_text(self):
        """Test that the text field is serialized."""
        data = CharacterLinkSerializer(self.link).data
        assert data['text'] == 'Official Wiki'

    def test_serializes_url(self):
        """Test that the url field is serialized."""
        data = CharacterLinkSerializer(self.link).data
        assert data['url'] == 'http://example.com/wiki'

    def test_does_not_include_character(self):
        """Test that the character field is not exposed."""
        data = CharacterLinkSerializer(self.link).data
        assert 'character' not in data

    def test_serializes_link_type_when_unset(self):
        """Test that link_type serializes as an empty string when unset."""
        data = CharacterLinkSerializer(self.link).data
        assert data['link_type'] == ''

    def test_serializes_link_type_when_set(self):
        """Test that link_type is serialized when set."""
        self.link.link_type = CharacterLink.LINK_TYPE_LOOTSTUDIO
        self.link.save()
        data = CharacterLinkSerializer(self.link).data
        assert data['link_type'] == 'lootstudio'
