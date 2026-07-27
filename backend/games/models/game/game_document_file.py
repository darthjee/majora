"""GameDocumentFile model for Majora RPG Campaign Management System."""

from django.db import models

from games.models.base_file import BaseFile
from games.models.game.game_document import GameDocument


class GameDocumentFile(BaseFile):
    """Model representing a (non-photo) file associated with a game document."""

    game_document = models.ForeignKey(
        GameDocument, on_delete=models.CASCADE, related_name='files',
    )
