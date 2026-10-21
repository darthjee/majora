"""View for the PC possessions/available.json endpoint."""

from ......decorators import token_scopes
from ...._character.possessions._possession_shared import build_possessions_available_view

game_pc_possessions_available = token_scopes(GET=[])(build_possessions_available_view(npc=False))
