"""View for the NPC photo set (role update) endpoint."""

from .......decorators import token_scopes
from ....._character.photos._photo_shared import build_photo_set_view

game_npc_photo_set = token_scopes(PATCH=['npcs:write'])(build_photo_set_view(npc=True))
