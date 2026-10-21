"""View for the DM-only PC item acquire-all endpoint (accepts hidden game items)."""

from .......decorators import token_scopes
from ....._character.items._item_shared import build_item_acquire_all_view

game_pc_item_acquire_all = token_scopes(POST=['pcs:write', 'items:read'])(
    build_item_acquire_all_view(npc=False),
)
