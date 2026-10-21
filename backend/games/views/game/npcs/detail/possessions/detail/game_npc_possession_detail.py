"""View for retrieving a single possession held by an NPC."""

from .......decorators import token_scopes
from ....._character.possessions._possession_shared import build_possession_detail_view

game_npc_possession_detail = token_scopes(GET=[])(build_possession_detail_view(npc=True))
