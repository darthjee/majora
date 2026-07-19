"""View for listing all items (including hidden) held by an NPC — DM/superuser only."""

from ......serializers import CharacterItemAllSerializer
from ...._character_shared import build_items_all_view

game_npc_items_all = build_items_all_view(npc=True, serializer_class=CharacterItemAllSerializer)
