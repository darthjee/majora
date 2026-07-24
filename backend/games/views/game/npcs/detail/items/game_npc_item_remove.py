"""View for the NPC item remove endpoint."""

from ...._character_shared import build_item_remove_view

game_npc_item_remove = build_item_remove_view(npc=True)
