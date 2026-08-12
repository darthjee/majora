"""Tests for the GamePossession model."""

from django.test import TestCase

from games.models import GamePossession
from games.tests.factories import GameFactory


class TestGamePossession(TestCase):
    """Tests for the GamePossession model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_game_possession_creation(self):
        """Test that a game possession can be created linked to a game."""
        possession = GamePossession.objects.create(
            game=self.game, name='The Rusty Anchor', description='A cozy tavern by the docks.',
        )
        assert possession.game == self.game
        assert possession.name == 'The Rusty Anchor'
        assert possession.description == 'A cozy tavern by the docks.'

    def test_hidden_defaults_to_false(self):
        """Test that a game possession is not hidden by default."""
        possession = GamePossession.objects.create(game=self.game, name='House')
        assert possession.hidden is False

    def test_game_possession_can_be_hidden(self):
        """Test that a game possession can be created as hidden."""
        possession = GamePossession.objects.create(
            game=self.game, name='Secret Hideout', hidden=True,
        )
        assert possession.hidden is True

    def test_description_defaults_to_empty_string(self):
        """Test that description defaults to an empty string when not specified."""
        possession = GamePossession.objects.create(game=self.game, name='Plain House')
        assert possession.description == ''

    def test_game_possession_str(self):
        """Test string representation of a game possession."""
        possession = GamePossession(game=self.game, name='Manor House')
        assert str(possession) == 'Manor House'

    def test_game_possessions_related_name(self):
        """Test that game possessions can be accessed via the game's related name."""
        GamePossession.objects.create(game=self.game, name='Possession One')
        GamePossession.objects.create(game=self.game, name='Possession Two')
        assert self.game.possessions.count() == 2

    def test_game_possession_ordering(self):
        """Test that game possessions are ordered by id."""
        first = GamePossession.objects.create(game=self.game, name='First Possession')
        second = GamePossession.objects.create(game=self.game, name='Second Possession')
        possessions = list(GamePossession.objects.all())
        assert possessions[0].id == first.id
        assert possessions[1].id == second.id

    def test_deleting_game_cascades_to_game_possession(self):
        """Test that deleting a game deletes its game possessions."""
        possession = GamePossession.objects.create(game=self.game, name='Doomed Possession')
        self.game.delete()
        assert not GamePossession.objects.filter(id=possession.id).exists()
