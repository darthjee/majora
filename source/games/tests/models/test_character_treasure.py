"""Tests for the CharacterTreasure model."""

import pytest
from django.db import IntegrityError, transaction

from games.models import Character, CharacterTreasure, Game, Treasure


@pytest.mark.django_db
class TestCharacterTreasure:
    """Tests for the CharacterTreasure model."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.character = Character.objects.create(name='Frodo', game=self.game)
        self.treasure = Treasure.objects.create(name='Golden Crown', value=500)

    def test_character_treasure_creation(self):
        """Test that a character treasure can be created linking a character and a treasure."""
        character_treasure = CharacterTreasure.objects.create(
            character=self.character, treasure=self.treasure, quantity=3,
        )
        assert character_treasure.character == self.character
        assert character_treasure.treasure == self.treasure
        assert character_treasure.quantity == 3

    def test_quantity_defaults_to_zero(self):
        """Test that quantity defaults to 0 when not specified."""
        character_treasure = CharacterTreasure.objects.create(
            character=self.character, treasure=self.treasure,
        )
        assert character_treasure.quantity == 0

    def test_character_treasure_str(self):
        """Test string representation of a character treasure."""
        character_treasure = CharacterTreasure(
            character=self.character, treasure=self.treasure, quantity=2,
        )
        assert str(character_treasure) == 'Golden Crown x2'

    def test_character_treasures_related_name(self):
        """Test that character treasures can be accessed via the character's related name."""
        CharacterTreasure.objects.create(
            character=self.character, treasure=self.treasure, quantity=1,
        )
        other_treasure = Treasure.objects.create(name='Silver Sword', value=100)
        CharacterTreasure.objects.create(
            character=self.character, treasure=other_treasure, quantity=1,
        )
        assert self.character.character_treasures.count() == 2

    def test_treasure_character_treasures_related_name(self):
        """Test that character treasures can be accessed via the treasure's related name."""
        CharacterTreasure.objects.create(
            character=self.character, treasure=self.treasure, quantity=1,
        )
        assert self.treasure.character_treasures.count() == 1

    def test_character_treasure_ordering(self):
        """Test that character treasures are ordered by id."""
        first = CharacterTreasure.objects.create(
            character=self.character, treasure=self.treasure, quantity=1,
        )
        second_treasure = Treasure.objects.create(name='Silver Sword', value=100)
        second = CharacterTreasure.objects.create(
            character=self.character, treasure=second_treasure, quantity=1,
        )
        character_treasures = list(CharacterTreasure.objects.all())
        assert character_treasures[0].id == first.id
        assert character_treasures[1].id == second.id

    def test_deleting_character_cascades_to_character_treasure(self):
        """Test that deleting a character deletes its character treasures."""
        character_treasure = CharacterTreasure.objects.create(
            character=self.character, treasure=self.treasure, quantity=1,
        )
        self.character.delete()
        assert not CharacterTreasure.objects.filter(id=character_treasure.id).exists()

    def test_deleting_treasure_cascades_to_character_treasure(self):
        """Test that deleting a treasure deletes the linking character treasure."""
        character_treasure = CharacterTreasure.objects.create(
            character=self.character, treasure=self.treasure, quantity=1,
        )
        self.treasure.delete()
        assert not CharacterTreasure.objects.filter(id=character_treasure.id).exists()

    def test_duplicate_character_treasure_raises_integrity_error(self):
        """Test that a second row for the same character/treasure pair is rejected."""
        CharacterTreasure.objects.create(
            character=self.character, treasure=self.treasure, quantity=1,
        )
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                CharacterTreasure.objects.create(
                    character=self.character, treasure=self.treasure, quantity=1,
                )
