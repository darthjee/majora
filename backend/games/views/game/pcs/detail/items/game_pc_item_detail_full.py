"""View for the PC item detail/full.json endpoint — dm, owner, or admin only (includes hidden)."""

from ......serializers import CharacterItemDetailFullSerializer
from ...._character_shared import build_item_detail_full_view

game_pc_item_detail_full = build_item_detail_full_view(
    npc=False, serializer_class=CharacterItemDetailFullSerializer,
)
