"""View for the PC faction remove (quit) endpoint."""

from .......decorators import token_scopes
from ....._character.factions._faction_shared import build_faction_remove_view

game_pc_faction_remove = token_scopes(POST=['pcs:write'])(build_faction_remove_view(npc=False))
