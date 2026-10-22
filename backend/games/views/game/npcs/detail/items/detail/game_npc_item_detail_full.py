"""View for retrieving any item (including hidden) held by an NPC — DM/superuser only."""

from .......decorators import token_scopes
from .......serializers import CharacterItemDetailFullSerializer
from ....._character.items._item_shared import build_item_detail_full_view

game_npc_item_detail_full = token_scopes(GET=['npcs:read', 'items:read'])(
    build_item_detail_full_view(
        npc=True, serializer_class=CharacterItemDetailFullSerializer,
    ),
)
