"""Tests for the CharacterPossession model."""

import pytest
from django.db import IntegrityError, transaction
from django.test import TestCase

from games.models import CharacterPossession
from games.tests.factories import CharacterFactory, GameFactory, GamePossessionFactory


class TestCharacterPossession(TestCase):
    """Tests for the CharacterPossession model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game)
        cls.game_possession = GamePossessionFactory(game=cls.game, name='Bag End')

    def test_character_possession_creation(self):
        """Test that a character possession can be created linking a character and a possession."""
        character_possession = CharacterPossession.objects.create(
            character=self.character, game_possession=self.game_possession,
        )
        assert character_possession.character == self.character
        assert character_possession.game_possession == self.game_possession

    def test_hidden_defaults_to_false(self):
        """Test that a character possession is not hidden by default."""
        character_possession = CharacterPossession.objects.create(
            character=self.character, game_possession=self.game_possession,
        )
        assert character_possession.hidden is False

    def test_character_possession_can_be_hidden(self):
        """Test that a character possession can be created as hidden."""
        character_possession = CharacterPossession.objects.create(
            character=self.character, game_possession=self.game_possession, hidden=True,
        )
        assert character_possession.hidden is True

    def test_character_possession_str_uses_game_possession_name(self):
        """Test that str() returns the linked game possession's name."""
        character_possession = CharacterPossession(
            character=self.character, game_possession=self.game_possession,
        )
        assert str(character_possession) == 'Bag End'

    def test_character_possessions_related_name(self):
        """Test that character possessions can be accessed via the character's related name."""
        CharacterPossession.objects.create(
            character=self.character, game_possession=self.game_possession,
        )
        other_possession = GamePossessionFactory(game=self.game, name='The Prancing Pony')
        CharacterPossession.objects.create(
            character=self.character, game_possession=other_possession,
        )
        assert self.character.character_possessions.count() == 2

    def test_game_possession_character_possessions_related_name(self):
        """Test that character possessions are reachable via the game possession's related name."""
        CharacterPossession.objects.create(
            character=self.character, game_possession=self.game_possession,
        )
        assert self.game_possession.character_possessions.count() == 1

    def test_character_possession_ordering(self):
        """Test that character possessions are ordered by id."""
        first = CharacterPossession.objects.create(
            character=self.character, game_possession=self.game_possession,
        )
        other_possession = GamePossessionFactory(game=self.game, name='The Prancing Pony')
        second = CharacterPossession.objects.create(
            character=self.character, game_possession=other_possession,
        )
        character_possessions = list(CharacterPossession.objects.all())
        assert character_possessions[0].id == first.id
        assert character_possessions[1].id == second.id

    def test_deleting_character_cascades_to_character_possession(self):
        """Test that deleting a character deletes its character possessions."""
        character_possession = CharacterPossession.objects.create(
            character=self.character, game_possession=self.game_possession,
        )
        self.character.delete()
        assert not CharacterPossession.objects.filter(id=character_possession.id).exists()

    def test_deleting_game_possession_cascades_to_character_possession(self):
        """Test that deleting a game possession deletes the linking character possession."""
        character_possession = CharacterPossession.objects.create(
            character=self.character, game_possession=self.game_possession,
        )
        self.game_possession.delete()
        assert not CharacterPossession.objects.filter(id=character_possession.id).exists()

    def test_duplicate_character_possession_raises_integrity_error(self):
        """Test that a second row for the same character/game_possession pair is rejected."""
        CharacterPossession.objects.create(
            character=self.character, game_possession=self.game_possession,
        )
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                CharacterPossession.objects.create(
                    character=self.character, game_possession=self.game_possession,
                )
