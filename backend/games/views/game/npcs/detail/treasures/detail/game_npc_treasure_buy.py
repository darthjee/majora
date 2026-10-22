"""View for the NPC treasure buy endpoint."""

from .......decorators import token_scopes
from ....._character.treasures._treasure_shared import build_treasure_buy_view

game_npc_treasure_buy = token_scopes(POST=['npcs:write'])(build_treasure_buy_view(npc=True))
