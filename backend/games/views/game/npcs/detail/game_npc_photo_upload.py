"""View for the NPC photo upload init endpoint."""

from ..._character_shared import build_photo_upload_view

game_npc_photo_upload = build_photo_upload_view(npc=True)
