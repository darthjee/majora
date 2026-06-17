"""Views package for the games app."""

from .characters import game_npc_detail, game_npcs, game_pc_detail, game_pcs
from .games import game_detail, games_list

__all__ = [
    'games_list',
    'game_detail',
    'game_pcs',
    'game_npcs',
    'game_npc_detail',
    'game_pc_detail',
]
