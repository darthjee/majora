"""GamePhoto model for Majora RPG Campaign Management System."""

from django.db import models

from games.models.game import Game


class GamePhoto(models.Model):
    """Model representing a photo associated with a game."""

    url = models.URLField()
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='photos')

    def __str__(self):
        """Return string representation of the game photo."""
        return self.url
