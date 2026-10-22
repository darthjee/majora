"""View for the NPC document remove endpoint."""

from .......decorators import token_scopes
from ....._character.documents._document_shared import build_document_remove_view

game_npc_document_remove = token_scopes(POST=['npcs:write'])(build_document_remove_view(npc=True))
