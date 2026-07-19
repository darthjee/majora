"""CharacterItemPhoto model for Majora RPG Campaign Management System."""

from django.db import models

from games.models.base_photo import BasePhoto
from games.models.character.character_item import CharacterItem


class CharacterItemPhoto(BasePhoto):
    """Model representing a photo associated with a character item."""

    character_item = models.ForeignKey(
        CharacterItem, on_delete=models.CASCADE, related_name='photos',
    )
