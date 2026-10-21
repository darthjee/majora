"""View for the PC documents/all.json endpoint — dm, owner, or admin only (includes hidden)."""

from ......decorators import token_scopes
from ......serializers import CharacterDocumentAllSerializer
from ...._character.documents._document_shared import build_documents_all_view

game_pc_documents_all = token_scopes(GET=['pcs:read', 'documents:read'])(
    build_documents_all_view(
        npc=False, serializer_class=CharacterDocumentAllSerializer,
    ),
)
