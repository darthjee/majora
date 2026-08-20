"""View for the NPC possessions/available.json endpoint."""

from ...._possession_shared import build_possessions_available_view

game_npc_possessions_available = build_possessions_available_view(npc=True)
