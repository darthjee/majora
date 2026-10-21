"""View for listing the ready files of a document held by a PC."""

from .......decorators import token_scopes
from ....._character.documents._document_shared import build_document_files_view

game_pc_document_files = token_scopes(GET=[])(build_document_files_view(npc=False))
