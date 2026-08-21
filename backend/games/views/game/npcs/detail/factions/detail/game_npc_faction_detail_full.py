"""View for the NPC faction detail/full.json endpoint — dm, owner, or admin only."""

from .......serializers import CharacterFactionAllSerializer
from ....._faction_shared import build_faction_detail_full_view

game_npc_faction_detail_full = build_faction_detail_full_view(
    npc=True, serializer_class=CharacterFactionAllSerializer,
)
