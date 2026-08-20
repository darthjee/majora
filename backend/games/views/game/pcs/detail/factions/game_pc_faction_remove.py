"""View for the PC faction remove (quit) endpoint."""

from ...._faction_shared import build_faction_remove_view

game_pc_faction_remove = build_faction_remove_view(npc=False)
