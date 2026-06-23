"""Link model for Majora RPG Campaign Management System."""

from django.db import models

from games.models.game import Game


class Link(models.Model):
    """Model representing an external link related to a game."""

    text = models.CharField(max_length=200)
    url = models.URLField()
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='links')

    def __str__(self):
        """Return string representation of the link."""
        return self.text
