"""View for retrieving any item (including hidden) held by an NPC — DM/superuser only."""

from ......serializers import CharacterItemDetailFullSerializer
from ...._character_shared import build_item_detail_full_view

game_npc_item_detail_full = build_item_detail_full_view(
    npc=True, serializer_class=CharacterItemDetailFullSerializer,
)
