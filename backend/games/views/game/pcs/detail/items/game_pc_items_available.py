"""View for the PC items/available.json endpoint."""

from ......decorators import token_scopes
from ...._character.items._item_shared import build_items_available_view

game_pc_items_available = token_scopes(GET=[])(build_items_available_view(npc=False))
