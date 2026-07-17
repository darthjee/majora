"""Tests for the GameTreasure model."""

import pytest
from django.db import IntegrityError, transaction
from django.test import TestCase

from games.models import GameTreasure
from games.tests.factories import GameFactory, TreasureFactory


class TestGameTreasure(TestCase):
    """Tests for the GameTreasure model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.treasure = TreasureFactory(name='Golden Crown', value=500)

    def test_game_treasure_creation(self):
        """Test that a game treasure link can be created with a max_units cap."""
        game_treasure = GameTreasure.objects.create(
            game=self.game, treasure=self.treasure, value=500, max_units=10,
        )
        assert game_treasure.game == self.game
        assert game_treasure.treasure == self.treasure
        assert game_treasure.max_units == 10

    def test_value_is_required(self):
        """Test that omitting value raises IntegrityError on save."""
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                GameTreasure.objects.create(game=self.game, treasure=self.treasure)

    def test_max_units_defaults_to_none(self):
        """Test that max_units defaults to None (unlimited) when not specified."""
        game_treasure = GameTreasure.objects.create(
            game=self.game, treasure=self.treasure, value=500,
        )
        assert game_treasure.max_units is None

    def test_acquired_units_defaults_to_zero(self):
        """Test that acquired_units defaults to 0 when not specified."""
        game_treasure = GameTreasure.objects.create(
            game=self.game, treasure=self.treasure, value=500,
        )
        assert game_treasure.acquired_units == 0

    def test_hidden_defaults_to_false(self):
        """Test that a game treasure is not hidden by default."""
        game_treasure = GameTreasure.objects.create(
            game=self.game, treasure=self.treasure, value=500,
        )
        assert game_treasure.hidden is False

    def test_game_treasure_can_be_hidden(self):
        """Test that a game treasure can be created as hidden."""
        game_treasure = GameTreasure.objects.create(
            game=self.game, treasure=self.treasure, value=500, hidden=True,
        )
        assert game_treasure.hidden is True

    def test_game_treasure_str(self):
        """Test string representation of a game treasure."""
        game_treasure = GameTreasure(game=self.game, treasure=self.treasure, value=500)
        assert str(game_treasure) == 'GameTreasure(game=Test Game, treasure=Golden Crown)'

    def test_game_treasure_ordering(self):
        """Test that game treasures are ordered by id."""
        first = GameTreasure.objects.create(game=self.game, treasure=self.treasure, value=500)
        second_treasure = TreasureFactory(name='Silver Sword', value=100)
        second = GameTreasure.objects.create(
            game=self.game, treasure=second_treasure, value=100,
        )
        game_treasures = list(GameTreasure.objects.all())
        assert game_treasures[0].id == first.id
        assert game_treasures[1].id == second.id

    def test_deleting_game_cascades_to_game_treasure(self):
        """Test that deleting a game deletes its game treasure links."""
        game_treasure = GameTreasure.objects.create(
            game=self.game, treasure=self.treasure, value=500,
        )
        self.game.delete()
        assert not GameTreasure.objects.filter(id=game_treasure.id).exists()

    def test_deleting_treasure_cascades_to_game_treasure(self):
        """Test that deleting a treasure deletes the linking game treasure."""
        game_treasure = GameTreasure.objects.create(
            game=self.game, treasure=self.treasure, value=500,
        )
        self.treasure.delete()
        assert not GameTreasure.objects.filter(id=game_treasure.id).exists()

    def test_duplicate_game_treasure_raises_integrity_error(self):
        """Test that a second row for the same game/treasure pair is rejected."""
        GameTreasure.objects.create(game=self.game, treasure=self.treasure, value=500)
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                GameTreasure.objects.create(game=self.game, treasure=self.treasure, value=500)


class TestGameTreasureAvailableUnits(TestCase):
    """Tests for GameTreasure.available_units."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.treasure = TreasureFactory(name='Golden Crown', value=500)

    def test_available_units_is_none_when_unlimited(self):
        """Test that available_units is None when max_units is None."""
        game_treasure = GameTreasure(game=self.game, treasure=self.treasure, value=500)
        assert game_treasure.available_units is None

    def test_available_units_is_max_minus_acquired(self):
        """Test that available_units subtracts acquired_units from max_units."""
        game_treasure = GameTreasure(
            game=self.game, treasure=self.treasure, value=500, max_units=10, acquired_units=4,
        )
        assert game_treasure.available_units == 6

    def test_available_units_is_zero_when_fully_acquired(self):
        """Test that available_units is 0 when acquired_units equals max_units."""
        game_treasure = GameTreasure(
            game=self.game, treasure=self.treasure, value=500, max_units=5, acquired_units=5,
        )
        assert game_treasure.available_units == 0

    def test_available_units_never_negative(self):
        """Test that available_units floors at 0 even if acquired_units exceeds max_units."""
        game_treasure = GameTreasure(
            game=self.game, treasure=self.treasure, value=500, max_units=5, acquired_units=8,
        )
        assert game_treasure.available_units == 0
