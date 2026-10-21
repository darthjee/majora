"""View for retrieving a single document held by an NPC."""

from .......decorators import token_scopes
from ....._character.documents._document_shared import build_document_detail_view

game_npc_document_detail = token_scopes(GET=[])(build_document_detail_view(npc=True))
