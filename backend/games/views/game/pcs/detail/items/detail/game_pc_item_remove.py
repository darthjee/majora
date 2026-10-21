"""View for the PC item remove endpoint."""

from .......decorators import token_scopes
from ....._character.items._item_shared import build_item_remove_view

game_pc_item_remove = token_scopes(POST=['pcs:write'])(build_item_remove_view(npc=False))
