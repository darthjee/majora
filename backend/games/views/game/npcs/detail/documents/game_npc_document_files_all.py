"""View for the NPC document files/all.json endpoint — DM/superuser only."""

from ...._document_shared import build_document_files_all_view

game_npc_document_files_all = build_document_files_all_view(npc=True)
