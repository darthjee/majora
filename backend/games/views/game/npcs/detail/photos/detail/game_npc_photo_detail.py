"""View for the NPC photo detail (update-ready / delete) endpoint."""

from .......decorators import token_scopes
from ....._character.photos._photo_shared import build_photo_detail_view

game_npc_photo_detail = token_scopes(PATCH=['npcs:write'], DELETE=['npcs:write'])(
    build_photo_detail_view(npc=True),
)
