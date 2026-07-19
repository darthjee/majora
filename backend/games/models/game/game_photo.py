"""GamePhoto model for Majora RPG Campaign Management System."""

from django.db import models

from games.models.base_photo import BasePhoto
from games.models.game.game import Game


class GamePhoto(BasePhoto):
    """Model representing a photo associated with a game."""

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='photos')
