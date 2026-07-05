"""GameMaster model for Majora RPG Campaign Management System."""

from django.contrib.auth.models import User
from django.db import models

from games.models.game import Game


class GameMaster(models.Model):
    """Model representing a DM (Dungeon Master) role for a game."""

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='game_masters')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='game_master_roles')

    class Meta:
        """Metadata for the GameMaster model."""

        unique_together = [('game', 'user')]
        ordering = ['id']

    def __str__(self):
        """Return string representation of the game master."""
        return f'GameMaster(game={self.game.name}, user={self.user.username})'
