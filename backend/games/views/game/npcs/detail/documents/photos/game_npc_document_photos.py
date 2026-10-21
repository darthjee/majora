"""View for listing the ready photos of a document held by an NPC."""

from .......decorators import token_scopes
from ....._character.documents._document_shared import build_document_photos_view

game_npc_document_photos = token_scopes(GET=[])(build_document_photos_view(npc=True))
