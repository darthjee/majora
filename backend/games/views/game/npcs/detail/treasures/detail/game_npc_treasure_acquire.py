"""View for the NPC treasure acquire endpoint."""

from .......decorators import token_scopes
from ....._character.treasures._treasure_shared import build_treasure_acquire_view

game_npc_treasure_acquire = token_scopes(POST=['npcs:write'])(build_treasure_acquire_view(npc=True))
