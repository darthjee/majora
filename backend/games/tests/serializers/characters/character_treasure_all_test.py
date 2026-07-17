"""Tests for the CharacterTreasureAllSerializer."""

from django.test import TestCase

from games.models import CharacterTreasure
from games.serializers import CharacterTreasureAllSerializer
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    GameTreasureFactory,
    TreasureFactory,
)


class TestCharacterTreasureAllSerializer(TestCase):
    """Tests for the CharacterTreasureAllSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game, npc=True)
        cls.treasure = TreasureFactory(name='Potion of Healing', value=50)
        cls.character_treasure = CharacterTreasure.objects.create(
            character=cls.character, treasure=cls.treasure, quantity=3,
        )

    def test_includes_hidden_field_alongside_character_treasure_fields(self):
        """Test that the serializer exposes every CharacterTreasureSerializer field plus hidden."""
        data = CharacterTreasureAllSerializer(
            self.character_treasure, context={'game': self.game},
        ).data
        assert set(data.keys()) == {
            'id', 'treasure_id', 'name', 'quantity', 'value', 'photo_path', 'hidden',
        }

    def test_hidden_defaults_to_false_without_game_treasure_row(self):
        """Test that hidden is False when no GameTreasure row exists for the context game."""
        data = CharacterTreasureAllSerializer(
            self.character_treasure, context={'game': self.game},
        ).data
        assert data['hidden'] is False

    def test_hidden_reflects_the_game_treasure_row(self):
        """Test that hidden reflects the context game's GameTreasure row for the held treasure."""
        GameTreasureFactory(
            game=self.game, treasure=self.treasure, value=self.treasure.value, hidden=True,
        )
        data = CharacterTreasureAllSerializer(
            self.character_treasure, context={'game': self.game},
        ).data
        assert data['hidden'] is True
