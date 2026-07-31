"""Views for the entity-agnostic `/permissions/*.json` endpoints (issue #926)."""

from .game_npc_permissions import game_npc_permissions
from .game_pc_permissions import game_pc_permissions
from .game_permissions import game_permissions
from .game_treasure_permissions import game_treasure_permissions
from .treasure_permissions import treasure_permissions

__all__ = [
    'game_permissions',
    'treasure_permissions',
    'game_treasure_permissions',
    'game_pc_permissions',
    'game_npc_permissions',
]
