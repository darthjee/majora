"""Views for game-level endpoints."""

from .game_access import game_access
from .game_detail import game_detail
from .game_permissions import game_permissions
from .game_photos import game_photos
from .game_treasure_detail import game_treasure_detail
from .game_treasures import game_treasures
from .game_treasures_all import game_treasures_all
from .games_list import games_list

__all__ = [
    'games_list',
    'game_detail',
    'game_access',
    'game_permissions',
    'game_treasures',
    'game_treasures_all',
    'game_treasure_detail',
    'game_photos',
]
