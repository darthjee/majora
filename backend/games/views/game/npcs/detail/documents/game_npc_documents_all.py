"""View for listing all documents (including hidden) held by an NPC — DM/superuser only."""

from ......serializers import CharacterDocumentAllSerializer
from ...._character_shared import build_documents_all_view

game_npc_documents_all = build_documents_all_view(
    npc=True, serializer_class=CharacterDocumentAllSerializer,
)
