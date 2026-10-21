"""View for the NPC possession detail/full.json endpoint — dm or admin only."""

from .......decorators import token_scopes
from .......serializers import CharacterPossessionAllSerializer
from ....._character.possessions._possession_shared import build_possession_detail_full_view

game_npc_possession_detail_full = token_scopes(GET=['npcs:read', 'possessions:read'])(
    build_possession_detail_full_view(
        npc=True, serializer_class=CharacterPossessionAllSerializer,
    ),
)
