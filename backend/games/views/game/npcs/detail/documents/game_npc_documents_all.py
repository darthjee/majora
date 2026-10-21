"""View for listing all documents (including hidden) held by an NPC — DM/superuser only."""

from ......decorators import token_scopes
from ......serializers import CharacterDocumentAllSerializer
from ...._character.documents._document_shared import build_documents_all_view

game_npc_documents_all = token_scopes(GET=['npcs:read', 'documents:read'])(
    build_documents_all_view(
        npc=True, serializer_class=CharacterDocumentAllSerializer,
    ),
)
