"""View for the PC documents/all.json endpoint — dm, owner, or admin only (includes hidden)."""

from ......serializers import CharacterDocumentAllSerializer
from ...._character_shared import build_documents_all_view

game_pc_documents_all = build_documents_all_view(
    npc=False, serializer_class=CharacterDocumentAllSerializer,
)
