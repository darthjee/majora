"""View for the DM-only NPC treasure acquire-all endpoint (accepts hidden treasures)."""

from ...._character_shared import build_treasure_acquire_all_view

game_npc_treasure_acquire_all = build_treasure_acquire_all_view(npc=True)
