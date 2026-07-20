"""View for the PC item photo upload init endpoint."""

from ...._character_shared import build_item_photo_upload_view

game_pc_item_photo_upload = build_item_photo_upload_view(npc=False)
