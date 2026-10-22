"""View for the NPC document acquire endpoint."""

from .......decorators import token_scopes
from ....._character.documents._document_shared import build_document_acquire_view

game_npc_document_acquire = token_scopes(POST=['npcs:write'])(build_document_acquire_view(npc=True))
