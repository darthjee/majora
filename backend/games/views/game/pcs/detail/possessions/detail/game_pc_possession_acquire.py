"""View for the PC possession acquire endpoint."""

from ....._character.possessions._possession_shared import build_possession_acquire_view

game_pc_possession_acquire = build_possession_acquire_view(npc=False)
