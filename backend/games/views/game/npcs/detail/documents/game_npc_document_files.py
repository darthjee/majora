"""View for listing the ready files of a document held by an NPC."""

from ...._document_shared import build_document_files_view

game_npc_document_files = build_document_files_view(npc=True)
