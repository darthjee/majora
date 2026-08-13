"""View for the PC possessions/all.json endpoint — dm, owner, or admin only (includes hidden)."""

from ......serializers import CharacterPossessionAllSerializer
from ...._character_shared import build_possessions_all_view

game_pc_possessions_all = build_possessions_all_view(
    npc=False, serializer_class=CharacterPossessionAllSerializer,
)
