"""View for listing an NPC's treasures."""

from ......decorators import token_scopes
from ...._character.treasures._treasure_shared import build_treasures_view

game_npc_treasures = token_scopes(GET=[])(build_treasures_view(npc=True))
