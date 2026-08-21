"""View for the NPC item acquire endpoint."""

from ....._character.items._item_shared import build_item_acquire_view

game_npc_item_acquire = build_item_acquire_view(npc=True)
