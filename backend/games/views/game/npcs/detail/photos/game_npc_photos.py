"""View for listing an NPC's photos."""

from ...._character.photos._photo_shared import build_photos_view

game_npc_photos = build_photos_view(npc=True)
