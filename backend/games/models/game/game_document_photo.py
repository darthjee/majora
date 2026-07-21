"""GameDocumentPhoto model for Majora RPG Campaign Management System."""

from django.db import models

from games.models.base_photo import BasePhoto
from games.models.game.game_document import GameDocument


class GameDocumentPhoto(BasePhoto):
    """Model representing a photo associated with a game document."""

    game_document = models.ForeignKey(
        GameDocument, on_delete=models.CASCADE, related_name='photos',
    )
