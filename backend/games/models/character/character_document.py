"""CharacterDocument model for Majora RPG Campaign Management System."""

from django.db import models
from simple_history.models import HistoricalRecords


class CharacterDocument(models.Model):
    """Model representing a game document held by a character.

    A thin join between a `Character` and a `GameDocument`: a document is not something a
    character has their own flavored instance of, so all display fields (`name`, `photo_path`)
    are sourced straight from the linked `GameDocument`. `hidden` is a plain field, never
    inherited from the `GameDocument`.
    """

    character = models.ForeignKey(
        'games.Character', on_delete=models.CASCADE, related_name='character_documents',
    )
    game_document = models.ForeignKey(
        'games.GameDocument', on_delete=models.CASCADE, related_name='character_documents',
    )
    hidden = models.BooleanField(default=False)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        """Metadata for the CharacterDocument model."""

        ordering = ['id']
        unique_together = [('character', 'game_document')]

    def __str__(self):
        """Return string representation of the character document."""
        return self.game_document.name
