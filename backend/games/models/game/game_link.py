"""GameLink model for Majora RPG Campaign Management System."""

from django.db import models

from games.models.base_link import BaseLink
from games.models.game.game import Game


class GameLink(BaseLink):
    """Model representing an external link related to a game."""

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='links')
