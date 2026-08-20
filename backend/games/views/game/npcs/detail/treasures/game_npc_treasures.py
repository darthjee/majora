"""View for listing an NPC's treasures."""

from ...._treasure_shared import build_treasures_view

game_npc_treasures = build_treasures_view(npc=True)
