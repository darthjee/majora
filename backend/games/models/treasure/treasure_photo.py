"""TreasurePhoto model for Majora RPG Campaign Management System."""

from django.db import models

from games.models.base_photo import BasePhoto
from games.models.treasure.treasure import Treasure


class TreasurePhoto(BasePhoto):
    """Model representing a photo associated with a treasure."""

    treasure = models.ForeignKey(Treasure, on_delete=models.CASCADE, related_name='photos')
