"""GameDocument model for Majora RPG Campaign Management System."""

from django.db import models
from simple_history.models import HistoricalRecords


class GameDocument(models.Model):
    """Model representing a special document belonging to a game."""

    game = models.ForeignKey(
        'games.Game', on_delete=models.CASCADE, related_name='documents',
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    photo = models.ForeignKey(
        'games.GameDocumentPhoto', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+',
    )
    hidden = models.BooleanField(default=False)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        """Metadata for the GameDocument model."""

        ordering = ['id']

    def __str__(self):
        """Return string representation of the game document."""
        return self.name
