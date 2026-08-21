"""View for listing the ready files of a document held by a PC."""

from ....._document_shared import build_document_files_view

game_pc_document_files = build_document_files_view(npc=False)
