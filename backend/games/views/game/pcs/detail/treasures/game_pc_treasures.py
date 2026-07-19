"""View for listing a PC's treasures."""

from ...._character_shared import build_treasures_view

game_pc_treasures = build_treasures_view(npc=False)
