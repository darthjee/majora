"""View for the PC possession detail/full.json endpoint — dm, owner, or admin only."""

from .......decorators import token_scopes
from .......serializers import CharacterPossessionAllSerializer
from ....._character.possessions._possession_shared import build_possession_detail_full_view

game_pc_possession_detail_full = token_scopes(GET=['pcs:read', 'possessions:read'])(
    build_possession_detail_full_view(
        npc=False, serializer_class=CharacterPossessionAllSerializer,
    ),
)
