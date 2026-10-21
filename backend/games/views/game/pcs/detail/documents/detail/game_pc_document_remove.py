"""View for the PC document remove endpoint."""

from .......decorators import token_scopes
from ....._character.documents._document_shared import build_document_remove_view

game_pc_document_remove = token_scopes(POST=['pcs:write'])(build_document_remove_view(npc=False))
