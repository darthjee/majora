"""View for listing a PC's factions."""

from ......decorators import token_scopes
from ...._character.factions._faction_shared import build_factions_view

game_pc_factions = token_scopes(GET=[])(build_factions_view(npc=False))
