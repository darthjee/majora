"""View for the NPC items/available.json endpoint."""

from ...._character_shared import build_items_available_view

game_npc_items_available = build_items_available_view(npc=True)
