"""Tests for the CharacterLinkSerializer."""

from django.test import TestCase

from games.models import CharacterLink
from games.serializers import CharacterLinkSerializer
from games.tests.factories import CharacterFactory, GameFactory


class TestCharacterLinkSerializer(TestCase):
    """Tests for the CharacterLinkSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game)
        cls.link = CharacterLink.objects.create(
            text='Official Wiki',
            url='http://example.com/wiki',
            character=cls.character,
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
