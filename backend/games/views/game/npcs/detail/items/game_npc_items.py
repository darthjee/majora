"""View for listing an NPC's items."""

from ...._item_shared import build_items_view

game_npc_items = build_items_view(npc=True)
