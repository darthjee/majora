"""View for the PC treasure acquire endpoint."""

from .......decorators import token_scopes
from ....._character.treasures._treasure_shared import build_treasure_acquire_view

game_pc_treasure_acquire = token_scopes(POST=['pcs:write'])(build_treasure_acquire_view(npc=False))
