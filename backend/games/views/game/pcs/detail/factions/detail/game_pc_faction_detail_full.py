"""View for the PC faction detail/full.json endpoint — dm, owner, or admin only."""

from .......decorators import token_scopes
from .......serializers import CharacterFactionAllSerializer
from ....._character.factions._faction_shared import build_faction_detail_full_view

game_pc_faction_detail_full = token_scopes(GET=['pcs:read', 'factions:read'])(
    build_faction_detail_full_view(
        npc=False, serializer_class=CharacterFactionAllSerializer,
    ),
)
