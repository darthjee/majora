"""View for the PC documents/available.json endpoint."""

from ...._character_shared import build_documents_available_view

game_pc_documents_available = build_documents_available_view(npc=False)
