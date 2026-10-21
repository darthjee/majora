"""View for the NPC faction detail/full.json endpoint — dm, owner, or admin only."""

from .......decorators import token_scopes
from .......serializers import CharacterFactionAllSerializer
from ....._character.factions._faction_shared import build_faction_detail_full_view

game_npc_faction_detail_full = token_scopes(GET=['npcs:read', 'factions:read'])(
    build_faction_detail_full_view(
        npc=True, serializer_class=CharacterFactionAllSerializer,
    ),
)
