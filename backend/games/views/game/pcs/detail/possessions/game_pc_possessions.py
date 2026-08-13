"""View for listing, or creating, a PC's possessions."""

from ...._character_shared import build_possessions_view

game_pc_possessions = build_possessions_view(npc=False)
