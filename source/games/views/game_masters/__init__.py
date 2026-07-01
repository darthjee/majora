"""Views for game master (DM) endpoints."""

from .game_master_detail import game_master_detail
from .game_masters_list import game_masters_list

__all__ = [
    'game_masters_list',
    'game_master_detail',
]
