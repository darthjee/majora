"""View for the NPC treasure remove endpoint."""

from .......decorators import token_scopes
from ....._character.treasures._treasure_shared import build_treasure_remove_view

game_npc_treasure_remove = token_scopes(POST=['npcs:write'])(build_treasure_remove_view(npc=True))
