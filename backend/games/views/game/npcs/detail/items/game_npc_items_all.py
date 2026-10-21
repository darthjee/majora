"""View for listing all items (including hidden) held by an NPC — DM/superuser only."""

from ......decorators import token_scopes
from ......serializers import CharacterItemAllSerializer
from ...._character.items._item_shared import build_items_all_view

game_npc_items_all = token_scopes(GET=['npcs:read', 'items:read'])(
    build_items_all_view(npc=True, serializer_class=CharacterItemAllSerializer),
)
