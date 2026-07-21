"""View for retrieving any item (including hidden) held by an NPC — DM/superuser only."""

from ......serializers import CharacterItemDetailAllSerializer
from ...._character_shared import build_item_detail_all_view

game_npc_item_detail_all = build_item_detail_all_view(
    npc=True, serializer_class=CharacterItemDetailAllSerializer,
)
