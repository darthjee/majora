"""View for the NPC treasure sell endpoint."""

from .......decorators import token_scopes
from ....._character.treasures._treasure_shared import build_treasure_sell_view

game_npc_treasure_sell = token_scopes(POST=['npcs:write'])(build_treasure_sell_view(npc=True))
