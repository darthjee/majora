"""View for retrieving a single document held by a PC."""

from .......decorators import token_scopes
from ....._character.documents._document_shared import build_document_detail_view

game_pc_document_detail = token_scopes(GET=[])(build_document_detail_view(npc=False))
