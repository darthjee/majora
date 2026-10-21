"""View for the DM-only NPC documents/available/all.json endpoint (includes hidden documents)."""

from ......decorators import token_scopes
from ...._character.documents._document_shared import build_documents_available_all_view

game_npc_documents_available_all = token_scopes(GET=['npcs:read', 'documents:read'])(
    build_documents_available_all_view(npc=True),
)
