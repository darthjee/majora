"""View for the DM-only PC treasure acquire-all endpoint (accepts hidden treasures)."""

from ...._character_shared import build_treasure_acquire_all_view

game_pc_treasure_acquire_all = build_treasure_acquire_all_view(npc=False)
