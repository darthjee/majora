"""View for the PC photo upload init endpoint."""

from .....decorators import token_scopes
from ..._character.photos._photo_shared import build_photo_upload_view

game_pc_photo_upload = token_scopes(POST=['pcs:write'])(build_photo_upload_view(npc=False))
