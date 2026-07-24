"""View for the DM-only NPC item acquire-all endpoint (accepts hidden game items)."""

from ...._character_shared import build_item_acquire_all_view

game_npc_item_acquire_all = build_item_acquire_all_view(npc=True)
