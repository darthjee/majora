"""GameItemPhoto model for Majora RPG Campaign Management System."""

from django.db import models

from games.models.base_photo import BasePhoto
from games.models.game.game_item import GameItem


class GameItemPhoto(BasePhoto):
    """Model representing a photo associated with a game item."""

    game_item = models.ForeignKey(GameItem, on_delete=models.CASCADE, related_name='photos')
