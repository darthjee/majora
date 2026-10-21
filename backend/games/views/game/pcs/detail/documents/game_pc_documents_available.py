"""View for the PC documents/available.json endpoint."""

from ......decorators import token_scopes
from ...._character.documents._document_shared import build_documents_available_view

game_pc_documents_available = token_scopes(GET=[])(build_documents_available_view(npc=False))
