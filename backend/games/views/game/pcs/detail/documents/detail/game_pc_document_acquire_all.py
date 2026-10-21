"""View for the DM-only PC document acquire-all endpoint (accepts hidden game documents)."""

from .......decorators import token_scopes
from ....._character.documents._document_shared import build_document_acquire_all_view

game_pc_document_acquire_all = token_scopes(POST=['pcs:write', 'documents:read'])(
    build_document_acquire_all_view(npc=False),
)
