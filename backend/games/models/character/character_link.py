"""CharacterLink model for Majora RPG Campaign Management System."""

from django.db import models

from games.models.base_link import BaseLink
from games.models.character.character import Character


class CharacterLink(BaseLink):
    """Model representing an external link related to a character."""

    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='links')
