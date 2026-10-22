"""View for the NPC item acquire endpoint."""

from .......decorators import token_scopes
from ....._character.items._item_shared import build_item_acquire_view

game_npc_item_acquire = token_scopes(POST=['npcs:write'])(build_item_acquire_view(npc=True))
