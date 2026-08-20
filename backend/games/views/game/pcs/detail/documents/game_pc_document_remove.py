"""View for the PC document remove endpoint."""

from ...._document_shared import build_document_remove_view

game_pc_document_remove = build_document_remove_view(npc=False)
