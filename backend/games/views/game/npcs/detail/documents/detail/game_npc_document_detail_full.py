"""View for retrieving any document (including hidden) held by an NPC — DM/superuser only."""

from .......serializers import CharacterDocumentAllSerializer
from ....._document_shared import build_document_detail_full_view

game_npc_document_detail_full = build_document_detail_full_view(
    npc=True, serializer_class=CharacterDocumentAllSerializer,
)
