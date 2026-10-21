"""View for the DM-only PC documents/available/all.json endpoint (includes hidden documents)."""

from ......decorators import token_scopes
from ...._character.documents._document_shared import build_documents_available_all_view

game_pc_documents_available_all = token_scopes(GET=['pcs:read', 'documents:read'])(
    build_documents_available_all_view(npc=False),
)
