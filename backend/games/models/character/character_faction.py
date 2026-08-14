"""CharacterFaction model for Majora RPG Campaign Management System."""

from django.db import models
from simple_history.models import HistoricalRecords


class CharacterFaction(models.Model):
    """Model representing a character's membership in a game faction.

    A thin join between a `Character` and a `GameFaction`: membership is not something a
    character has their own flavored instance of, so all display fields (`name`, `photo_path`)
    are sourced straight from the linked `GameFaction`. `hidden` is a plain field, never
    inherited from the `GameFaction` (which has no `hidden` concept of its own).
    """

    character = models.ForeignKey(
        'games.Character', on_delete=models.CASCADE, related_name='character_factions',
    )
    game_faction = models.ForeignKey(
        'games.GameFaction', on_delete=models.CASCADE, related_name='character_factions',
    )
    hidden = models.BooleanField(default=False)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        """Metadata for the CharacterFaction model."""

        ordering = ['id']
        unique_together = [('character', 'game_faction')]

    def __str__(self):
        """Return string representation of the character faction membership."""
        return self.game_faction.name
