"""View for retrieving a single document held by an NPC."""

from ...._character_shared import build_document_detail_view

game_npc_document_detail = build_document_detail_view(npc=True)
