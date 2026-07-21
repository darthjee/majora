"""View for the PC item detail/all.json endpoint — dm, owner, or admin only (includes hidden)."""

from ......serializers import CharacterItemDetailAllSerializer
from ...._character_shared import build_item_detail_all_view

game_pc_item_detail_all = build_item_detail_all_view(
    npc=False, serializer_class=CharacterItemDetailAllSerializer,
)
