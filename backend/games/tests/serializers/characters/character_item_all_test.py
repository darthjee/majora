"""Tests for the CharacterItemAllSerializer."""

from django.test import TestCase

from games.models import CharacterItem
from games.serializers import CharacterItemAllSerializer
from games.tests.factories import CharacterFactory, GameFactory, GameItemFactory


class TestCharacterItemAllSerializer(TestCase):
    """Tests for the CharacterItemAllSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game, npc=True)
        cls.game_item = GameItemFactory(game=cls.game, name='Cloak of Elvenkind')
        cls.character_item = CharacterItem.objects.create(
            character=cls.character, game_item=cls.game_item,
        )

    def test_includes_hidden_field_alongside_character_item_fields(self):
        """Test that the serializer exposes every CharacterItemSerializer field plus hidden."""
        data = CharacterItemAllSerializer(self.character_item).data
        assert set(data.keys()) == {
            'id', 'game_item_id', 'name', 'photo_path', 'hidden',
        }

    def test_hidden_reflects_the_character_item_own_field(self):
        """Test that hidden reflects the character item's own hidden field."""
        self.character_item.hidden = True
        self.character_item.save()
        data = CharacterItemAllSerializer(self.character_item).data
        assert data['hidden'] is True

    def test_hidden_defaults_to_false(self):
        """Test that hidden defaults to False when not set."""
        data = CharacterItemAllSerializer(self.character_item).data
        assert data['hidden'] is False
