"""View for the PC document detail/full.json endpoint — dm, owner, or admin only."""

from .......decorators import token_scopes
from .......serializers import CharacterDocumentAllSerializer
from ....._character.documents._document_shared import build_document_detail_full_view

game_pc_document_detail_full = token_scopes(GET=['pcs:read', 'documents:read'])(
    build_document_detail_full_view(
        npc=False, serializer_class=CharacterDocumentAllSerializer,
    ),
)
