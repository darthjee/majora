"""View for the PC access-check endpoint."""

from .....decorators import token_scopes
from .....serializers import PcAccessSerializer
from ..._character import build_access_view

game_pc_access = token_scopes(GET=[])(
    build_access_view(npc=False, access_serializer_class=PcAccessSerializer),
)
