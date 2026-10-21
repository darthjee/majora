"""View for listing a PC's photos."""

from ......decorators import token_scopes
from ...._character.photos._photo_shared import build_photos_view

game_pc_photos = token_scopes(GET=[])(build_photos_view(npc=False))
