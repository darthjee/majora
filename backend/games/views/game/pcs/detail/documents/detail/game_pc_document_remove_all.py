"""View for the restricted PC document remove-all endpoint (dm/admin/owner; accepts hidden)."""

from .......decorators import token_scopes
from ....._character.documents._document_shared import build_document_remove_all_view

game_pc_document_remove_all = token_scopes(POST=['pcs:write', 'documents:read'])(
    build_document_remove_all_view(npc=False),
)
