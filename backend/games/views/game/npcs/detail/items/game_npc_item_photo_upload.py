"""View for the NPC item photo upload init endpoint."""

from ...._character_shared import build_item_photo_upload_view

game_npc_item_photo_upload = build_item_photo_upload_view(npc=True)
