"""GamePossessionPhoto model for Majora RPG Campaign Management System."""

from django.db import models

from games.models.base_photo import BasePhoto
from games.models.game.game_possession import GamePossession


class GamePossessionPhoto(BasePhoto):
    """Model representing a photo associated with a game possession."""

    game_possession = models.ForeignKey(
        GamePossession, on_delete=models.CASCADE, related_name='photos',
    )
