"""View for the PC access-check endpoint."""

from .....serializers import PcAccessSerializer
from ..._character_shared import build_access_view

game_pc_access = build_access_view(npc=False, access_serializer_class=PcAccessSerializer)
