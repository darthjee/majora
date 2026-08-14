"""GameFactionPhoto model for Majora RPG Campaign Management System."""

from django.db import models

from games.models.base_photo import BasePhoto
from games.models.game.game_faction import GameFaction


class GameFactionPhoto(BasePhoto):
    """Model representing a photo associated with a faction."""

    faction = models.ForeignKey(GameFaction, on_delete=models.CASCADE, related_name='photos')
