"""View for the PC document files/all.json endpoint — dm, owner, or admin only."""

from .......decorators import token_scopes
from ....._character.documents._document_shared import build_document_files_all_view

game_pc_document_files_all = token_scopes(GET=['pcs:read', 'documents:read'])(
    build_document_files_all_view(npc=False),
)
