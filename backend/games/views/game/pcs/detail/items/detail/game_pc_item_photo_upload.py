"""View for the PC item photo upload init endpoint."""

from .......decorators import token_scopes
from ....._character.items._item_shared import build_item_photo_upload_view

game_pc_item_photo_upload = token_scopes(POST=['pcs:write', 'items:write'])(
    build_item_photo_upload_view(npc=False),
)
