"""Tests for the Player model."""

import pytest
from django.db import IntegrityError, transaction

from games.models import Player
from games.tests.factories import GameFactory, PlayerFactory, UserFactory


@pytest.mark.django_db
class TestPlayer:
    """Tests for the Player model."""

    def test_player_creation(self):
        """Test that a player can be created with a name."""
        player = PlayerFactory(name='Alice')
        assert player.name == 'Alice'

    def test_player_str(self):
        """Test string representation of a player."""
        player = Player(name='Bob')
        assert str(player) == 'Bob'

    def test_player_belongs_to_a_game(self):
        """Test that a player is associated with a game via the game FK."""
        game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        player = PlayerFactory(name='Alice', game=game)
        assert player.game == game
        assert player in game.players.all()

    def test_is_dm_defaults_to_false(self):
        """Test that is_dm defaults to False."""
        player = PlayerFactory(name='Alice')
        assert player.is_dm is False

    def test_is_dm_can_be_overridden(self):
        """Test that is_dm can be explicitly set to True."""
        player = PlayerFactory(name='Alice', is_dm=True)
        assert player.is_dm is True

    def test_unique_together_game_and_user_allows_same_user_on_different_games(self):
        """Test that the same user can have a Player row on two different games."""
        user = UserFactory()
        game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        other_game = GameFactory(name='Other Quest', game_slug='other-quest')
        PlayerFactory(game=game, user=user)
        PlayerFactory(game=other_game, user=user)
        assert Player.objects.filter(user=user).count() == 2

    def test_unique_together_game_and_user_rejects_duplicate_row(self):
        """Test that a duplicate (game, user) Player row raises IntegrityError."""
        user = UserFactory()
        game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        PlayerFactory(game=game, user=user)
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                PlayerFactory(game=game, user=user)
