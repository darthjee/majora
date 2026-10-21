"""View for the DM-only PC treasure acquire-all endpoint (accepts hidden treasures)."""

from .......decorators import token_scopes
from ....._character.treasures._treasure_shared import build_treasure_acquire_all_view

game_pc_treasure_acquire_all = token_scopes(POST=['pcs:write', 'treasures:read'])(
    build_treasure_acquire_all_view(npc=False),
)
