"""Player model for Majora RPG Campaign Management System."""

from django.contrib.auth.models import User
from django.db import models

from games.models.game import Game


class Player(models.Model):
    """Model representing a player participating in games."""

    name = models.CharField(max_length=200)
    games = models.ManyToManyField(Game, blank=True, related_name='players')
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='players_accounts',
    )

    class Meta:
        """Metadata for the Player model."""

        ordering = ['name']

    def __str__(self):
        """Return string representation of the player."""
        return self.name
