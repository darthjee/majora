"""View for the PC possessions/available.json endpoint."""

from ...._character_shared import build_possessions_available_view

game_pc_possessions_available = build_possessions_available_view(npc=False)
