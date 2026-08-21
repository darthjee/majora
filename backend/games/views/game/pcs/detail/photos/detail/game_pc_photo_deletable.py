"""View for the PC photo deletable-check endpoint."""

from ....._photo_shared import build_photo_deletable_view

game_pc_photo_deletable = build_photo_deletable_view(npc=False)
