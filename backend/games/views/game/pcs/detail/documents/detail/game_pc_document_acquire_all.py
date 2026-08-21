"""View for the DM-only PC document acquire-all endpoint (accepts hidden game documents)."""

from ....._character.documents._document_shared import build_document_acquire_all_view

game_pc_document_acquire_all = build_document_acquire_all_view(npc=False)
