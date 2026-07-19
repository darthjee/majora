"""View for the PC treasure acquire endpoint."""

from ...._character_shared import build_treasure_acquire_view

game_pc_treasure_acquire = build_treasure_acquire_view(npc=False)
