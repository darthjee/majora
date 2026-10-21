"""View for listing an NPC's documents."""

from ......decorators import token_scopes
from ...._character.documents._document_shared import build_documents_view

game_npc_documents = token_scopes(GET=[])(build_documents_view(npc=True))
