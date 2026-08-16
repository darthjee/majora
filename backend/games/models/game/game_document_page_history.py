"""GameDocumentPageHistory model for Majora RPG Campaign Management System."""

from django.db import models

from games.models.game.game_document import GameDocument


class GameDocumentPageHistory(models.Model):
    """Archived pre-save snapshot of a GameDocumentPage.

    Deliberately holds no foreign key to the live `GameDocumentPage` row: that row can be
    deleted entirely (e.g. when a document's page count shrinks), and its history must survive
    independently of the live row's own lifecycle. Only tied to the owning `GameDocument`.
    """

    game_document = models.ForeignKey(
        GameDocument, on_delete=models.CASCADE, related_name='page_history',
    )
    order = models.PositiveIntegerField()
    version = models.PositiveIntegerField()
    content = models.TextField(blank=True, default='')

    class Meta:
        """Metadata for the GameDocumentPageHistory model."""

        ordering = ['game_document', 'version', 'order']

    def __str__(self):
        """Return string representation of the archived page history entry."""
        return f'{self.game_document.name} — v{self.version} page {self.order}'
