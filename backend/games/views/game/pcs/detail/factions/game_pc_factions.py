"""View for listing a PC's factions."""

from ...._character_shared import build_factions_view

game_pc_factions = build_factions_view(npc=False)
