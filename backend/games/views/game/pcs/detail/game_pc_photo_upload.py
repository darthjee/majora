"""View for the PC photo upload init endpoint."""

from ..._character_shared import build_photo_upload_view

game_pc_photo_upload = build_photo_upload_view(npc=False)
