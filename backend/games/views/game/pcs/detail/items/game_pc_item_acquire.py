"""View for the PC item acquire endpoint."""

from ...._character_shared import build_item_acquire_view

game_pc_item_acquire = build_item_acquire_view(npc=False)
