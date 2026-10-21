"""View for the DM-only NPC items/available/all.json endpoint (includes hidden items)."""

from ......decorators import token_scopes
from ...._character.items._item_shared import build_items_available_all_view

game_npc_items_available_all = token_scopes(GET=['npcs:read', 'items:read'])(
    build_items_available_all_view(npc=True),
)
