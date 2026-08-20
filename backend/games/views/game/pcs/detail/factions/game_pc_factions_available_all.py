"""View for the DM-only PC factions/available/all.json endpoint."""

from ...._faction_shared import build_factions_available_all_view

game_pc_factions_available_all = build_factions_available_all_view(npc=False)
