"""View for the PC document acquire endpoint."""

from .......decorators import token_scopes
from ....._character.documents._document_shared import build_document_acquire_view

game_pc_document_acquire = token_scopes(POST=['pcs:write'])(build_document_acquire_view(npc=False))
