"""View for the NPC access-check endpoint."""

from .....serializers import CharacterAccessSerializer
from ..._character_shared import build_access_view

game_npc_access = build_access_view(npc=True, access_serializer_class=CharacterAccessSerializer)
