"""View for the DM-only PC item acquire-all endpoint (accepts hidden game items)."""

from ...._character_shared import build_item_acquire_all_view

game_pc_item_acquire_all = build_item_acquire_all_view(npc=False)
