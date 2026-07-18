"""Player model for Majora RPG Campaign Management System."""

from django.contrib.auth.models import User
from django.db import models
from simple_history.models import HistoricalRecords

from games.models.game.game import Game


class Player(models.Model):
    """Model representing a player participating in games."""

    name = models.CharField(max_length=200)
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='players')
    is_dm = models.BooleanField(default=False)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='players_accounts',
    )
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        """Metadata for the Player model."""

        ordering = ['name']
        unique_together = [('game', 'user')]

    def __str__(self):
        """Return string representation of the player."""
        return self.name
