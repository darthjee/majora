"""View for the DM-only NPC item remove-all endpoint (accepts hidden items)."""

from ...._character_shared import build_item_remove_all_view

game_npc_item_remove_all = build_item_remove_all_view(npc=True)
