"""View for the PC photo deletable-check endpoint."""

from .......decorators import token_scopes
from ....._character.photos._photo_shared import build_photo_deletable_view

game_pc_photo_deletable = token_scopes(GET=['pcs:read'])(build_photo_deletable_view(npc=False))
