"""View for the PC items/available.json endpoint."""

from ...._character_shared import build_items_available_view

game_pc_items_available = build_items_available_view(npc=False)
