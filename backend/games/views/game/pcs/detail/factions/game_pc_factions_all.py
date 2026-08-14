"""View for the PC factions/all.json endpoint — dm, owner, or admin only (includes hidden)."""

from ......serializers import CharacterFactionAllSerializer
from ...._character_shared import build_factions_all_view

game_pc_factions_all = build_factions_all_view(
    npc=False, serializer_class=CharacterFactionAllSerializer,
)
