"""View for the PC photo detail (update-ready / delete) endpoint."""

from ...._photo_shared import build_photo_detail_view

game_pc_photo_detail = build_photo_detail_view(npc=False)
