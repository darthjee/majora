"""View for the PC treasure sell endpoint."""

from .......decorators import token_scopes
from ....._character.treasures._treasure_shared import build_treasure_sell_view

game_pc_treasure_sell = token_scopes(POST=['pcs:write'])(build_treasure_sell_view(npc=False))
