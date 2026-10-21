"""View for the PC factions/all.json endpoint — dm, owner, or admin only (includes hidden)."""

from ......decorators import token_scopes
from ......serializers import CharacterFactionAllSerializer
from ...._character.factions._faction_shared import build_factions_all_view

game_pc_factions_all = token_scopes(GET=['pcs:read', 'factions:read'])(
    build_factions_all_view(
        npc=False, serializer_class=CharacterFactionAllSerializer,
    ),
)
