"""View for the NPC item remove endpoint."""

from .......decorators import token_scopes
from ....._character.items._item_shared import build_item_remove_view

game_npc_item_remove = token_scopes(POST=['npcs:write'])(build_item_remove_view(npc=True))
