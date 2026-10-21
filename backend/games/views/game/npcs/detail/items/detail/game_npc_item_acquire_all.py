"""View for the DM-only NPC item acquire-all endpoint (accepts hidden game items)."""

from .......decorators import token_scopes
from ....._character.items._item_shared import build_item_acquire_all_view

game_npc_item_acquire_all = token_scopes(POST=['npcs:write', 'items:read'])(
    build_item_acquire_all_view(npc=True),
)
