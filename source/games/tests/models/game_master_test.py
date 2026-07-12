"""Tests for the GameMaster model."""

import pytest

from games.models import GameMaster
from games.tests.factories import GameFactory, GameMasterFactory, UserFactory


@pytest.mark.django_db
class TestGameMaster:
    """Tests for the GameMaster model."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.user = UserFactory(username='dm_user', password='secret-password')

    def test_game_master_creation(self):
        """Test that a game master can be created linking a game to a user."""
        gm = GameMasterFactory(game=self.game, user=self.user)
        assert gm.game == self.game
        assert gm.user == self.user

    def test_game_master_str(self):
        """Test string representation of a game master."""
        gm = GameMaster(game=self.game, user=self.user)
        assert str(gm) == 'GameMaster(game=Test Game, user=dm_user)'

    def test_multiple_dms_per_game(self):
        """Test that a game can have multiple DMs."""
        user2 = UserFactory(username='dm_user2', password='secret-password')
        GameMasterFactory(game=self.game, user=self.user)
        GameMasterFactory(game=self.game, user=user2)
        assert self.game.game_masters.count() == 2

    def test_unique_together_prevents_duplicate(self):
        """Test that the same user cannot be added as DM of the same game twice."""
        from django.db import IntegrityError
        GameMasterFactory(game=self.game, user=self.user)
        with pytest.raises(IntegrityError):
            GameMasterFactory(game=self.game, user=self.user)

    def test_cascade_delete_on_game(self):
        """Test that game master is deleted when the game is deleted."""
        gm = GameMasterFactory(game=self.game, user=self.user)
        self.game.delete()
        assert not GameMaster.objects.filter(id=gm.id).exists()

    def test_cascade_delete_on_user(self):
        """Test that game master is deleted when the user is deleted."""
        gm = GameMasterFactory(game=self.game, user=self.user)
        self.user.delete()
        assert not GameMaster.objects.filter(id=gm.id).exists()
