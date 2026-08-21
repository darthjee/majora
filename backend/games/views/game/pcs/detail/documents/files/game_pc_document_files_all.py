"""View for the PC document files/all.json endpoint — dm, owner, or admin only."""

from ....._character.documents._document_shared import build_document_files_all_view

game_pc_document_files_all = build_document_files_all_view(npc=False)
