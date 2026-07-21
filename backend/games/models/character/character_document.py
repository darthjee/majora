"""CharacterDocument model for Majora RPG Campaign Management System."""

from django.db import models
from simple_history.models import HistoricalRecords


class CharacterDocument(models.Model):
    """Model representing a game document held by a character, with optional overrides.

    `name`/`description`/`photo` are nullable overrides of the linked `GameDocument`'s own
    values — a `null` value falls back to the `GameDocument`'s value when serialized (see
    `resolve_character_document_field`). `hidden` is a plain field, never inherited from the
    `GameDocument`.
    """

    character = models.ForeignKey(
        'games.Character', on_delete=models.CASCADE, related_name='character_documents',
    )
    game_document = models.ForeignKey(
        'games.GameDocument', on_delete=models.CASCADE, related_name='character_documents',
    )
    name = models.CharField(max_length=200, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    photo = models.ForeignKey(
        'games.CharacterDocumentPhoto', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+',
    )
    hidden = models.BooleanField(default=False)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        """Metadata for the CharacterDocument model."""

        ordering = ['id']
        unique_together = [('character', 'game_document')]

    def __str__(self):
        """Return string representation of the character document."""
        return self.name or self.game_document.name
