"""Tests for the CharacterItem model."""

import pytest
from django.db import IntegrityError, transaction
from django.test import TestCase

from games.models import CharacterItem
from games.tests.factories import CharacterFactory, GameFactory, GameItemFactory


class TestCharacterItem(TestCase):
    """Tests for the CharacterItem model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game)
        cls.game_item = GameItemFactory(game=cls.game, name='Cloak of Elvenkind')

    def test_character_item_creation(self):
        """Test that a character item can be created linking a character and a game item."""
        character_item = CharacterItem.objects.create(
            character=self.character, game_item=self.game_item,
        )
        assert character_item.character == self.character
        assert character_item.game_item == self.game_item

    def test_name_defaults_to_none(self):
        """Test that name defaults to None (falls back to the game item's name)."""
        character_item = CharacterItem.objects.create(
            character=self.character, game_item=self.game_item,
        )
        assert character_item.name is None

    def test_description_defaults_to_none(self):
        """Test that description defaults to None (falls back to the game item's)."""
        character_item = CharacterItem.objects.create(
            character=self.character, game_item=self.game_item,
        )
        assert character_item.description is None

    def test_hidden_defaults_to_false(self):
        """Test that a character item is not hidden by default."""
        character_item = CharacterItem.objects.create(
            character=self.character, game_item=self.game_item,
        )
        assert character_item.hidden is False

    def test_character_item_can_be_hidden(self):
        """Test that a character item can be created as hidden."""
        character_item = CharacterItem.objects.create(
            character=self.character, game_item=self.game_item, hidden=True,
        )
        assert character_item.hidden is True

    def test_character_item_can_override_name_and_description(self):
        """Test that a character item's own name/description override the game item's."""
        character_item = CharacterItem.objects.create(
            character=self.character, game_item=self.game_item,
            name='Frodo\'s Cloak', description='Slightly frayed at the edges.',
        )
        assert character_item.name == 'Frodo\'s Cloak'
        assert character_item.description == 'Slightly frayed at the edges.'

    def test_character_item_str_falls_back_to_game_item_name(self):
        """Test that str() falls back to the game item's name when no override is set."""
        character_item = CharacterItem(character=self.character, game_item=self.game_item)
        assert str(character_item) == 'Cloak of Elvenkind'

    def test_character_item_str_uses_own_name_when_set(self):
        """Test that str() uses the character item's own name when overridden."""
        character_item = CharacterItem(
            character=self.character, game_item=self.game_item, name='Frodo\'s Cloak',
        )
        assert str(character_item) == 'Frodo\'s Cloak'

    def test_character_items_related_name(self):
        """Test that character items can be accessed via the character's related name."""
        CharacterItem.objects.create(character=self.character, game_item=self.game_item)
        other_item = GameItemFactory(game=self.game, name='Ring of Protection')
        CharacterItem.objects.create(character=self.character, game_item=other_item)
        assert self.character.character_items.count() == 2

    def test_game_item_character_items_related_name(self):
        """Test that character items can be accessed via the game item's related name."""
        CharacterItem.objects.create(character=self.character, game_item=self.game_item)
        assert self.game_item.character_items.count() == 1

    def test_character_item_ordering(self):
        """Test that character items are ordered by id."""
        first = CharacterItem.objects.create(character=self.character, game_item=self.game_item)
        other_item = GameItemFactory(game=self.game, name='Ring of Protection')
        second = CharacterItem.objects.create(character=self.character, game_item=other_item)
        character_items = list(CharacterItem.objects.all())
        assert character_items[0].id == first.id
        assert character_items[1].id == second.id

    def test_deleting_character_cascades_to_character_item(self):
        """Test that deleting a character deletes its character items."""
        character_item = CharacterItem.objects.create(
            character=self.character, game_item=self.game_item,
        )
        self.character.delete()
        assert not CharacterItem.objects.filter(id=character_item.id).exists()

    def test_deleting_game_item_cascades_to_character_item(self):
        """Test that deleting a game item deletes the linking character item."""
        character_item = CharacterItem.objects.create(
            character=self.character, game_item=self.game_item,
        )
        self.game_item.delete()
        assert not CharacterItem.objects.filter(id=character_item.id).exists()

    def test_duplicate_character_item_raises_integrity_error(self):
        """Test that a second row for the same character/game_item pair is rejected."""
        CharacterItem.objects.create(character=self.character, game_item=self.game_item)
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                CharacterItem.objects.create(character=self.character, game_item=self.game_item)
