"""Tests for the Player model."""

import pytest

from games.models import Game, Player


@pytest.mark.django_db
class TestPlayer:

    """Tests for the Player model."""

    def test_player_creation(self):
        """Test that a player can be created with a name."""
        player = Player.objects.create(name='Alice')
        assert player.name == 'Alice'

    def test_player_str(self):
        """Test string representation of a player."""
        player = Player(name='Bob')
        assert str(player) == 'Bob'

    def test_player_can_join_game(self):
        """Test that a player can be associated with a game."""
        game = Game.objects.create(name='Epic Quest', game_slug='epic-quest')
        player = Player.objects.create(name='Alice')
        player.games.add(game)
        assert game in player.games.all()
        assert player in game.players.all()
