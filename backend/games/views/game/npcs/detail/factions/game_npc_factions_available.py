"""View for the NPC factions/available.json endpoint."""

from ...._character.factions._faction_shared import build_factions_available_view

game_npc_factions_available = build_factions_available_view(npc=True)
