"""View for the NPC photo upload init endpoint."""

from .....decorators import token_scopes
from ..._character.photos._photo_shared import build_photo_upload_view

game_npc_photo_upload = token_scopes(POST=['npcs:write'])(build_photo_upload_view(npc=True))
