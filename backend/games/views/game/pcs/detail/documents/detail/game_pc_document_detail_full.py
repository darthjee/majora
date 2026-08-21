"""View for the PC document detail/full.json endpoint — dm, owner, or admin only."""

from .......serializers import CharacterDocumentAllSerializer
from ....._character.documents._document_shared import build_document_detail_full_view

game_pc_document_detail_full = build_document_detail_full_view(
    npc=False, serializer_class=CharacterDocumentAllSerializer,
)
