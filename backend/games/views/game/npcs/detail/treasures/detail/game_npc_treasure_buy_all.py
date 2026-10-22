"""View for the DM-only NPC treasure buy-all endpoint (accepts hidden treasures)."""

from .......decorators import token_scopes
from ....._character.treasures._treasure_shared import build_treasure_buy_all_view

game_npc_treasure_buy_all = token_scopes(POST=['npcs:write', 'treasures:read'])(
    build_treasure_buy_all_view(npc=True),
)
