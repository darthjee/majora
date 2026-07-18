"""GameItem model for Majora RPG Campaign Management System."""

from django.db import models
from simple_history.models import HistoricalRecords


class GameItem(models.Model):
    """Model representing a special magic item belonging to a game."""

    game = models.ForeignKey(
        'games.Game', on_delete=models.CASCADE, related_name='items',
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    photo = models.ForeignKey(
        'games.GameItemPhoto', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+',
    )
    hidden = models.BooleanField(default=False)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        """Metadata for the GameItem model."""

        ordering = ['id']

    def __str__(self):
        """Return string representation of the game item."""
        return self.name
