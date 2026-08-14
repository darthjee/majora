"""View for the DM-only NPC factions/available/all.json endpoint."""

from ...._character_shared import build_factions_available_all_view

game_npc_factions_available_all = build_factions_available_all_view(npc=True)
