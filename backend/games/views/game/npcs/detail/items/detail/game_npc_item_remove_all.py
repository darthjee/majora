"""View for the DM-only NPC item remove-all endpoint (accepts hidden items)."""

from .......decorators import token_scopes
from ....._character.items._item_shared import build_item_remove_all_view

game_npc_item_remove_all = token_scopes(POST=['npcs:write', 'items:read'])(
    build_item_remove_all_view(npc=True),
)
