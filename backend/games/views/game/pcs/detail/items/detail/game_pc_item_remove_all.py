"""View for the restricted PC item remove-all endpoint (dm/admin/owner; accepts hidden items)."""

from .......decorators import token_scopes
from ....._character.items._item_shared import build_item_remove_all_view

game_pc_item_remove_all = token_scopes(POST=['pcs:write', 'items:read'])(
    build_item_remove_all_view(npc=False),
)
