"""View for the PC treasure remove endpoint."""

from .......decorators import token_scopes
from ....._character.treasures._treasure_shared import build_treasure_remove_view

game_pc_treasure_remove = token_scopes(POST=['pcs:write'])(build_treasure_remove_view(npc=False))
