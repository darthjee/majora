"""View for the PC document acquire endpoint."""

from ....._document_shared import build_document_acquire_view

game_pc_document_acquire = build_document_acquire_view(npc=False)
