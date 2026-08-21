"""View for the NPC factions/all.json endpoint — dm, owner, or admin only (includes hidden)."""

from ......serializers import CharacterFactionAllSerializer
from ...._character.factions._faction_shared import build_factions_all_view

game_npc_factions_all = build_factions_all_view(
    npc=True, serializer_class=CharacterFactionAllSerializer,
)
