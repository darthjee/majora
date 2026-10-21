"""View for retrieving a single faction membership held by a NPC."""

from .......decorators import token_scopes
from ....._character.factions._faction_shared import build_faction_detail_view

game_npc_faction_detail = token_scopes(GET=[])(build_faction_detail_view(npc=True))
