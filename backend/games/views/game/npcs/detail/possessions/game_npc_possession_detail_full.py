"""View for the NPC possession detail/full.json endpoint — dm or admin only."""

from ......serializers import CharacterPossessionAllSerializer
from ...._possession_shared import build_possession_detail_full_view

game_npc_possession_detail_full = build_possession_detail_full_view(
    npc=True, serializer_class=CharacterPossessionAllSerializer,
)
