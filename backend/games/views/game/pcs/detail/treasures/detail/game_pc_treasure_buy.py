"""View for the PC treasure buy endpoint."""

from .......decorators import token_scopes
from ....._character.treasures._treasure_shared import build_treasure_buy_view

game_pc_treasure_buy = token_scopes(POST=['pcs:write'])(build_treasure_buy_view(npc=False))
