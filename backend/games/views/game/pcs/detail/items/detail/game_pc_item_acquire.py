"""View for the PC item acquire endpoint."""

from .......decorators import token_scopes
from ....._character.items._item_shared import build_item_acquire_view

game_pc_item_acquire = token_scopes(POST=['pcs:write'])(build_item_acquire_view(npc=False))
