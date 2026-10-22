"""View for retrieving any document (including hidden) held by an NPC — DM/superuser only."""

from .......decorators import token_scopes
from .......serializers import CharacterDocumentAllSerializer
from ....._character.documents._document_shared import build_document_detail_full_view

game_npc_document_detail_full = token_scopes(GET=['npcs:read', 'documents:read'])(
    build_document_detail_full_view(
        npc=True, serializer_class=CharacterDocumentAllSerializer,
    ),
)
