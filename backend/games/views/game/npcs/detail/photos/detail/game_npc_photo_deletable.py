"""View for the NPC photo deletable-check endpoint."""

from .......decorators import token_scopes
from ....._character.photos._photo_shared import build_photo_deletable_view

game_npc_photo_deletable = token_scopes(GET=['npcs:read'])(build_photo_deletable_view(npc=True))
