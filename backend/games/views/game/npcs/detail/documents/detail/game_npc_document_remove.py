"""View for the NPC document remove endpoint."""

from ....._document_shared import build_document_remove_view

game_npc_document_remove = build_document_remove_view(npc=True)
