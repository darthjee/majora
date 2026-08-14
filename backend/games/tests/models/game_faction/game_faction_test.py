"""Tests for the GameFaction model."""

import pytest
from django.db import IntegrityError, transaction
from django.test import TestCase

from games.models import GameFaction
from games.tests.factories import GameFactory


class TestGameFaction(TestCase):
    """Tests for the GameFaction model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_faction_creation(self):
        """Test that a faction can be created linked to a game."""
        faction = GameFaction.objects.create(game=self.game, name='The Silver Hand')
        assert faction.game == self.game
        assert faction.name == 'The Silver Hand'

    def test_faction_str(self):
        """Test string representation of a faction."""
        faction = GameFaction(game=self.game, name='The Silver Hand')
        assert str(faction) == 'The Silver Hand'

    def test_factions_related_name(self):
        """Test that factions can be accessed via the game's related name."""
        GameFaction.objects.create(game=self.game, name='Faction One')
        GameFaction.objects.create(game=self.game, name='Faction Two')
        assert self.game.factions.count() == 2

    def test_faction_ordering(self):
        """Test that factions are ordered by id."""
        first = GameFaction.objects.create(game=self.game, name='First Faction')
        second = GameFaction.objects.create(game=self.game, name='Second Faction')
        factions = list(GameFaction.objects.all())
        assert factions[0].id == first.id
        assert factions[1].id == second.id

    def test_deleting_game_cascades_to_faction(self):
        """Test that deleting a game deletes its factions."""
        faction = GameFaction.objects.create(game=self.game, name='Doomed Faction')
        self.game.delete()
        assert not GameFaction.objects.filter(id=faction.id).exists()

    def test_faction_photo_defaults_to_none(self):
        """Test that a new faction has no photo by default."""
        faction = GameFaction.objects.create(game=self.game, name='Photoless Faction')
        assert faction.photo is None


class TestGameFactionUniqueNamePerGame(TestCase):
    """Tests for the unique_faction_name_per_game DB constraint."""

    @classmethod
    def setUpTestData(cls):
        """Set up two games and a faction in the first one."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')
        cls.faction = GameFaction.objects.create(game=cls.game, name='The Silver Hand')

    def test_same_name_in_same_game_raises_integrity_error(self):
        """Test that two factions with the same name in the same game are not allowed."""
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                GameFaction.objects.create(game=self.game, name='The Silver Hand')

    def test_same_name_in_different_games_is_allowed(self):
        """Test that two factions in different games may share the same name."""
        faction = GameFaction.objects.create(game=self.other_game, name='The Silver Hand')
        assert faction.name == 'The Silver Hand'
