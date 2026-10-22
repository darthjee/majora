"""View for the restricted NPC document remove-all endpoint (dm/admin; accepts hidden)."""

from .......decorators import token_scopes
from ....._character.documents._document_shared import build_document_remove_all_view

game_npc_document_remove_all = token_scopes(POST=['npcs:write', 'documents:read'])(
    build_document_remove_all_view(npc=True),
)
