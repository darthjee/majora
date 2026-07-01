"""Views for character-level endpoints."""

from .game_npc_access import game_npc_access
from .game_npc_detail import game_npc_detail
from .game_npc_full import game_npc_full
from .game_npcs import game_npcs
from .game_npcs_all import game_npcs_all
from .game_pc_access import game_pc_access
from .game_pc_detail import game_pc_detail
from .game_pc_full import game_pc_full
from .game_pcs import game_pcs

__all__ = [
    'game_pcs',
    'game_npcs',
    'game_npc_detail',
    'game_npcs_all',
    'game_pc_detail',
    'game_npc_full',
    'game_pc_full',
    'game_pc_access',
    'game_npc_access',
]
