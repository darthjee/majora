"""View for the PC faction detail/full.json endpoint — dm, owner, or admin only."""

from ......serializers import CharacterFactionAllSerializer
from ...._faction_shared import build_faction_detail_full_view

game_pc_faction_detail_full = build_faction_detail_full_view(
    npc=False, serializer_class=CharacterFactionAllSerializer,
)
