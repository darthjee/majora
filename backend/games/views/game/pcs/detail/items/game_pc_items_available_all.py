"""View for the DM-only PC items/available/all.json endpoint (includes hidden items)."""

from ...._character_shared import build_items_available_all_view

game_pc_items_available_all = build_items_available_all_view(npc=False)
