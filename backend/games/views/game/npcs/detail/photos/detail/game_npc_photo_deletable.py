"""View for the NPC photo deletable-check endpoint."""

from ....._character.photos._photo_shared import build_photo_deletable_view

game_npc_photo_deletable = build_photo_deletable_view(npc=True)
