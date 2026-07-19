"""View for the PC items/all.json endpoint — dm, owner, or admin only (includes hidden)."""

from ......serializers import CharacterItemAllSerializer
from ...._character_shared import build_items_all_view

game_pc_items_all = build_items_all_view(npc=False, serializer_class=CharacterItemAllSerializer)
