"""View for the NPC faction remove (quit) endpoint."""

from .......decorators import token_scopes
from ....._character.factions._faction_shared import build_faction_remove_view

game_npc_faction_remove = token_scopes(POST=['npcs:write'])(build_faction_remove_view(npc=True))
