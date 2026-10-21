"""View for the PC photo detail (update-ready / delete) endpoint."""

from .......decorators import token_scopes
from ....._character.photos._photo_shared import build_photo_detail_view

game_pc_photo_detail = token_scopes(PATCH=['pcs:write'], DELETE=['pcs:write'])(
    build_photo_detail_view(npc=False),
)
