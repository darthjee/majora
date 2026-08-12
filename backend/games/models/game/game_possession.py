"""GamePossession model for Majora RPG Campaign Management System."""

from django.db import models
from simple_history.models import HistoricalRecords


class GamePossession(models.Model):
    """Model representing a large, unique belonging (house, boat, tavern) of a game."""

    game = models.ForeignKey(
        'games.Game', on_delete=models.CASCADE, related_name='possessions',
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    photo = models.ForeignKey(
        'games.GamePossessionPhoto', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+',
    )
    hidden = models.BooleanField(default=False)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        """Metadata for the GamePossession model."""

        ordering = ['id']

    def __str__(self):
        """Return string representation of the game possession."""
        return self.name
