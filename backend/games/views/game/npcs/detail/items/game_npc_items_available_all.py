"""View for the DM-only NPC items/available/all.json endpoint (includes hidden items)."""

from ...._item_shared import build_items_available_all_view

game_npc_items_available_all = build_items_available_all_view(npc=True)
