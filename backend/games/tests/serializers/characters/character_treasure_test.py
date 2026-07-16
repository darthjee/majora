"""Tests for the CharacterTreasureSerializer."""

from django.test import TestCase

from games.models import CharacterTreasure, GameTreasure, TreasurePhoto
from games.serializers import CharacterTreasureSerializer
from games.tests.factories import CharacterFactory, GameFactory, TreasureFactory


class TestCharacterTreasureSerializer(TestCase):
    """Tests for the CharacterTreasureSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game)
        cls.treasure = TreasureFactory(name='Potion of Healing', value=50)
        cls.character_treasure = CharacterTreasure.objects.create(
            character=cls.character, treasure=cls.treasure, quantity=3,
        )

    def test_serializes_id(self):
        """Test that the id field is serialized as the CharacterTreasure row id."""
        data = CharacterTreasureSerializer(self.character_treasure).data
        assert data['id'] == self.character_treasure.id

    def test_serializes_treasure_id_from_treasure(self):
        """Test that the treasure_id field is sourced from the related treasure's id."""
        data = CharacterTreasureSerializer(self.character_treasure).data
        assert data['treasure_id'] == self.treasure.id

    def test_serializes_name_from_treasure(self):
        """Test that the name field is sourced from the related treasure."""
        data = CharacterTreasureSerializer(self.character_treasure).data
        assert data['name'] == 'Potion of Healing'

    def test_serializes_quantity(self):
        """Test that the quantity field is serialized from the through model."""
        data = CharacterTreasureSerializer(self.character_treasure).data
        assert data['quantity'] == 3

    def test_serializes_value_from_treasure(self):
        """Test that the value field is sourced from the related treasure."""
        data = CharacterTreasureSerializer(self.character_treasure).data
        assert data['value'] == 50

    def test_value_falls_back_to_treasure_value_when_treasure_not_linked(self):
        """Test that value falls back to Treasure.value when there is no GameTreasure row."""
        data = CharacterTreasureSerializer(
            self.character_treasure, context={'game': self.game},
        ).data
        assert data['value'] == 50

    def test_value_reflects_the_game_treasure_row(self):
        """Test that value reflects the game's GameTreasure row, not Treasure.value."""
        self.game.treasures.add(self.treasure, through_defaults={'value': 80})
        data = CharacterTreasureSerializer(
            self.character_treasure, context={'game': self.game},
        ).data
        assert data['value'] == 80

    def test_value_uses_prefetched_game_treasures_map_when_provided(self):
        """Test that value uses a prefetched game_treasures_by_treasure_id map over a query."""
        self.game.treasures.add(self.treasure, through_defaults={'value': 80})
        game_treasure = GameTreasure.objects.get(game=self.game, treasure=self.treasure)
        game_treasure.value = 120
        context = {
            'game': self.game,
            'game_treasures_by_treasure_id': {self.treasure.id: game_treasure},
        }
        data = CharacterTreasureSerializer(self.character_treasure, context=context).data
        assert data['value'] == 120

    def test_photo_path_is_none_without_photo(self):
        """Test that photo_path is None when the treasure has no photo."""
        data = CharacterTreasureSerializer(self.character_treasure).data
        assert data['photo_path'] is None

    def test_photo_path_reflects_attached_photo(self):
        """Test that photo_path is the treasure's photo path once attached."""
        photo = TreasurePhoto.objects.create(
            treasure=self.treasure, path='photos/treasures/1/photo.png'
        )
        self.treasure.photo = photo
        self.treasure.save()
        data = CharacterTreasureSerializer(self.character_treasure).data
        assert data['photo_path'] == 'photos/treasures/1/photo.png'

    def test_does_not_include_character(self):
        """Test that the character field is not exposed."""
        data = CharacterTreasureSerializer(self.character_treasure).data
        assert 'character' not in data

    def test_does_not_include_treasure(self):
        """Test that the raw treasure field is not exposed."""
        data = CharacterTreasureSerializer(self.character_treasure).data
        assert 'treasure' not in data
