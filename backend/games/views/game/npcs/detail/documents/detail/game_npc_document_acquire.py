"""View for the NPC document acquire endpoint."""

from ....._character.documents._document_shared import build_document_acquire_view

game_npc_document_acquire = build_document_acquire_view(npc=True)
