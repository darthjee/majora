"""GameFaction model for Majora RPG Campaign Management System."""

from django.db import models
from simple_history.models import HistoricalRecords


class GameFaction(models.Model):
    """Model representing a group a character may belong to, scoped to a single game."""

    game = models.ForeignKey(
        'games.Game', on_delete=models.CASCADE, related_name='factions',
    )
    name = models.CharField(max_length=200)
    photo = models.ForeignKey(
        'games.GameFactionPhoto', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+',
    )
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        """Metadata for the GameFaction model."""

        ordering = ['id']
        constraints = [
            models.UniqueConstraint(
                fields=['game', 'name'], name='unique_faction_name_per_game',
            ),
        ]

    def __str__(self):
        """Return string representation of the faction."""
        return self.name
