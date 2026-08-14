"""Tests for the CharacterFaction model."""

import pytest
from django.db import IntegrityError, transaction
from django.test import TestCase

from games.models import CharacterFaction
from games.tests.factories import CharacterFactory, GameFactionFactory, GameFactory


class TestCharacterFaction(TestCase):
    """Tests for the CharacterFaction model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game)
        cls.game_faction = GameFactionFactory(game=cls.game, name='The Silver Hand')

    def test_character_faction_creation(self):
        """Test that a character faction can be created linking a character and a faction."""
        character_faction = CharacterFaction.objects.create(
            character=self.character, game_faction=self.game_faction,
        )
        assert character_faction.character == self.character
        assert character_faction.game_faction == self.game_faction

    def test_hidden_defaults_to_false(self):
        """Test that a character faction is not hidden by default."""
        character_faction = CharacterFaction.objects.create(
            character=self.character, game_faction=self.game_faction,
        )
        assert character_faction.hidden is False

    def test_character_faction_can_be_hidden(self):
        """Test that a character faction can be created as hidden."""
        character_faction = CharacterFaction.objects.create(
            character=self.character, game_faction=self.game_faction, hidden=True,
        )
        assert character_faction.hidden is True

    def test_character_faction_str_uses_game_faction_name(self):
        """Test that str() returns the linked game faction's name."""
        character_faction = CharacterFaction(
            character=self.character, game_faction=self.game_faction,
        )
        assert str(character_faction) == 'The Silver Hand'

    def test_character_factions_related_name(self):
        """Test that character factions can be accessed via the character's related name."""
        CharacterFaction.objects.create(character=self.character, game_faction=self.game_faction)
        other_faction = GameFactionFactory(game=self.game, name='The Iron Circle')
        CharacterFaction.objects.create(character=self.character, game_faction=other_faction)
        assert self.character.character_factions.count() == 2

    def test_game_faction_character_factions_related_name(self):
        """Test that character factions can be accessed via the game faction's related name."""
        CharacterFaction.objects.create(character=self.character, game_faction=self.game_faction)
        assert self.game_faction.character_factions.count() == 1

    def test_character_faction_ordering(self):
        """Test that character factions are ordered by id."""
        first = CharacterFaction.objects.create(
            character=self.character, game_faction=self.game_faction,
        )
        other_faction = GameFactionFactory(game=self.game, name='The Iron Circle')
        second = CharacterFaction.objects.create(
            character=self.character, game_faction=other_faction,
        )
        character_factions = list(CharacterFaction.objects.all())
        assert character_factions[0].id == first.id
        assert character_factions[1].id == second.id

    def test_deleting_character_cascades_to_character_faction(self):
        """Test that deleting a character deletes its character factions."""
        character_faction = CharacterFaction.objects.create(
            character=self.character, game_faction=self.game_faction,
        )
        self.character.delete()
        assert not CharacterFaction.objects.filter(id=character_faction.id).exists()

    def test_deleting_game_faction_cascades_to_character_faction(self):
        """Test that deleting a game faction deletes the linking character faction."""
        character_faction = CharacterFaction.objects.create(
            character=self.character, game_faction=self.game_faction,
        )
        self.game_faction.delete()
        assert not CharacterFaction.objects.filter(id=character_faction.id).exists()

    def test_duplicate_character_faction_raises_integrity_error(self):
        """Test that a second row for the same character/game_faction pair is rejected."""
        CharacterFaction.objects.create(character=self.character, game_faction=self.game_faction)
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                CharacterFaction.objects.create(
                    character=self.character, game_faction=self.game_faction,
                )
