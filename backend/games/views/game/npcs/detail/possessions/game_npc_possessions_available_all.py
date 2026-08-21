"""View for the DM-only NPC possessions/available/all.json endpoint (includes hidden)."""

from ...._character.possessions._possession_shared import build_possessions_available_all_view

game_npc_possessions_available_all = build_possessions_available_all_view(npc=True)
