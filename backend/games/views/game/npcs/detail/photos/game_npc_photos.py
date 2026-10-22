"""View for listing an NPC's photos."""

from ......decorators import token_scopes
from ...._character.photos._photo_shared import build_photos_view

game_npc_photos = token_scopes(GET=[])(build_photos_view(npc=True))
