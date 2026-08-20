"""View for the NPC documents/available.json endpoint."""

from ...._document_shared import build_documents_available_view

game_npc_documents_available = build_documents_available_view(npc=True)
