"""GameCommonItemPhoto model for Majora RPG Campaign Management System."""

from django.db import models

from games.models.base_photo import BasePhoto
from games.models.game.game_common_item import GameCommonItem


class GameCommonItemPhoto(BasePhoto):
    """Model representing a photo associated with a game common item."""

    game_common_item = models.ForeignKey(
        GameCommonItem, on_delete=models.CASCADE, related_name='photos',
    )
