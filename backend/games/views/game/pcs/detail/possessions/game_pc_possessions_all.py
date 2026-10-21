"""View for the PC possessions/all.json endpoint — dm, owner, or admin only (includes hidden)."""

from ......decorators import token_scopes
from ......serializers import CharacterPossessionAllSerializer
from ...._character.possessions._possession_shared import build_possessions_all_view

game_pc_possessions_all = token_scopes(GET=['pcs:read', 'possessions:read'])(
    build_possessions_all_view(
        npc=False, serializer_class=CharacterPossessionAllSerializer,
    ),
)
