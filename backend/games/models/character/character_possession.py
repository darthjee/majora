"""CharacterPossession model for Majora RPG Campaign Management System."""

from django.db import models
from simple_history.models import HistoricalRecords


class CharacterPossession(models.Model):
    """Model representing a game possession held by a character.

    A thin join between a `Character` and a `GamePossession`: a possession is not something
    a character has their own flavored instance of, so all display fields (`name`,
    `description`, `photo_path`) are sourced straight from the linked `GamePossession`.
    `hidden` is a plain field, never inherited from the `GamePossession`.
    """

    character = models.ForeignKey(
        'games.Character', on_delete=models.CASCADE, related_name='character_possessions',
    )
    game_possession = models.ForeignKey(
        'games.GamePossession', on_delete=models.CASCADE, related_name='character_possessions',
    )
    hidden = models.BooleanField(default=False)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        """Metadata for the CharacterPossession model."""

        ordering = ['id']
        unique_together = [('character', 'game_possession')]

    def __str__(self):
        """Return string representation of the character possession."""
        return self.game_possession.name
