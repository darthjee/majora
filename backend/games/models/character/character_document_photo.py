"""CharacterDocumentPhoto model for Majora RPG Campaign Management System."""

from django.db import models

from games.models.base_photo import BasePhoto
from games.models.character.character_document import CharacterDocument


class CharacterDocumentPhoto(BasePhoto):
    """Model representing a photo associated with a character document."""

    character_document = models.ForeignKey(
        CharacterDocument, on_delete=models.CASCADE, related_name='photos',
    )
