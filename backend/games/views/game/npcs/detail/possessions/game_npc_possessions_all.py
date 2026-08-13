"""View for listing all possessions (including hidden) held by an NPC — DM/superuser only."""

from ......serializers import CharacterPossessionAllSerializer
from ...._character_shared import build_possessions_all_view

game_npc_possessions_all = build_possessions_all_view(
    npc=True, serializer_class=CharacterPossessionAllSerializer,
)
