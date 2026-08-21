"""View for retrieving a single document held by a PC."""

from ....._document_shared import build_document_detail_view

game_pc_document_detail = build_document_detail_view(npc=False)
