"""GameDocumentPage model for Majora RPG Campaign Management System."""

from django.db import models

from games.models.game.game_document import GameDocument


class GameDocumentPage(models.Model):
    """Model representing a single ordered page of a game document's content."""

    game_document = models.ForeignKey(
        GameDocument, on_delete=models.CASCADE, related_name='pages',
    )
    content = models.TextField(blank=True, default='')
    order = models.PositiveIntegerField()

    class Meta:
        """Metadata for the GameDocumentPage model."""

        ordering = ['game_document', 'order']

    def __str__(self):
        """Return string representation of the game document page."""
        return f'{self.game_document.name} — page {self.order}'
