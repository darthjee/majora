"""Views for character-level endpoints."""

from .game_npc_access import game_npc_access
from .game_npc_detail import game_npc_detail
from .game_npc_full import game_npc_full
from .game_npc_permissions import game_npc_permissions
from .game_npc_photo_set import game_npc_photo_set
from .game_npc_photo_upload import game_npc_photo_upload
from .game_npc_photos import game_npc_photos
from .game_npc_treasure_acquire import game_npc_treasure_acquire
from .game_npc_treasure_sell import game_npc_treasure_sell
from .game_npc_treasures import game_npc_treasures
from .game_npcs import game_npcs
from .game_npcs_all import game_npcs_all
from .game_pc_access import game_pc_access
from .game_pc_detail import game_pc_detail
from .game_pc_full import game_pc_full
from .game_pc_permissions import game_pc_permissions
from .game_pc_photo_set import game_pc_photo_set
from .game_pc_photo_upload import game_pc_photo_upload
from .game_pc_photos import game_pc_photos
from .game_pc_treasure_acquire import game_pc_treasure_acquire
from .game_pc_treasure_sell import game_pc_treasure_sell
from .game_pc_treasures import game_pc_treasures
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
    'game_pc_permissions',
    'game_npc_permissions',
    'game_pc_photo_upload',
    'game_npc_photo_upload',
    'game_pc_photo_set',
    'game_npc_photo_set',
    'game_pc_photos',
    'game_npc_photos',
    'game_pc_treasures',
    'game_npc_treasures',
    'game_pc_treasure_acquire',
    'game_pc_treasure_sell',
    'game_npc_treasure_acquire',
    'game_npc_treasure_sell',
]
