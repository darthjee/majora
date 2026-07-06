"""Tests for the CharacterTreasureSerializer."""

import pytest

from games.models import Character, CharacterTreasure, Game, Treasure, TreasurePhoto
from games.serializers import CharacterTreasureSerializer


@pytest.mark.django_db
class TestCharacterTreasureSerializer:
    """Tests for the CharacterTreasureSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.character = Character.objects.create(name='Frodo', game=self.game)
        self.treasure = Treasure.objects.create(name='Potion of Healing', value=50)
        self.character_treasure = CharacterTreasure.objects.create(
            character=self.character, treasure=self.treasure, quantity=3,
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
