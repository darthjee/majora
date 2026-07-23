"""View for the PC treasure remove endpoint."""

from ...._character_shared import build_treasure_remove_view

game_pc_treasure_remove = build_treasure_remove_view(npc=False)
