"""View for the NPC access-check endpoint."""

from .....decorators import token_scopes
from .....serializers import CharacterAccessSerializer
from ..._character import build_access_view

game_npc_access = token_scopes(GET=[])(
    build_access_view(npc=True, access_serializer_class=CharacterAccessSerializer),
)
