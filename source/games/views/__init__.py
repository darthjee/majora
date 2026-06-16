"""Views package for the games app."""

from .characters import character_detail, game_npcs, game_pcs
from .games import game_detail, games_list

__all__ = ['games_list', 'game_detail', 'game_pcs', 'game_npcs', 'character_detail']
