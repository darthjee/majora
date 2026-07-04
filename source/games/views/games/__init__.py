"""Views for game-level endpoints."""

from .game_access import game_access
from .game_detail import game_detail
from .game_photos import game_photos
from .game_treasures import game_treasures
from .games_list import games_list

__all__ = [
    'games_list',
    'game_detail',
    'game_access',
    'game_treasures',
    'game_photos',
]
