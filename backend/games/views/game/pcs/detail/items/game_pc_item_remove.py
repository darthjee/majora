"""View for the PC item remove endpoint."""

from ...._character_shared import build_item_remove_view

game_pc_item_remove = build_item_remove_view(npc=False)
