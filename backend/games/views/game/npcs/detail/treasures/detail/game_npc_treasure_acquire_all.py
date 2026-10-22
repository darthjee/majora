"""View for the DM-only NPC treasure acquire-all endpoint (accepts hidden treasures)."""

from .......decorators import token_scopes
from ....._character.treasures._treasure_shared import build_treasure_acquire_all_view

game_npc_treasure_acquire_all = token_scopes(POST=['npcs:write', 'treasures:read'])(
    build_treasure_acquire_all_view(npc=True),
)
