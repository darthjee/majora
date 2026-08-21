"""View for the restricted PC document remove-all endpoint (dm/admin/owner; accepts hidden)."""

from ....._document_shared import build_document_remove_all_view

game_pc_document_remove_all = build_document_remove_all_view(npc=False)
