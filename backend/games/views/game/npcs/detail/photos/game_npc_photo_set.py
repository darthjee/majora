"""View for the NPC photo set (role update) endpoint."""

from ...._character_shared import build_photo_set_view

game_npc_photo_set = build_photo_set_view(npc=True)
