"""View for the NPC photo detail (update-ready / delete) endpoint."""

from ...._character_shared import build_photo_detail_view

game_npc_photo_detail = build_photo_detail_view(npc=True)
