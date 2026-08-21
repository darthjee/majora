"""View for the PC possession remove endpoint."""

from ....._possession_shared import build_possession_remove_view

game_pc_possession_remove = build_possession_remove_view(npc=False)
