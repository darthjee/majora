"""CharacterPhoto model for Majora RPG Campaign Management System."""

from django.db import models

from games.models.base_photo import BasePhoto
from games.models.character.character import Character


class CharacterPhoto(BasePhoto):
    """Model representing a photo associated with a character."""

    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='photos')
