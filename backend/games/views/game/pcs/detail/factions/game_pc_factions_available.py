"""View for the PC factions/available.json endpoint."""

from ...._character.factions._faction_shared import build_factions_available_view

game_pc_factions_available = build_factions_available_view(npc=False)
