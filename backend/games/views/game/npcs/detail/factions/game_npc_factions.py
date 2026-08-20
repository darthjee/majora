"""View for listing a NPC's factions."""

from ...._faction_shared import build_factions_view

game_npc_factions = build_factions_view(npc=True)
