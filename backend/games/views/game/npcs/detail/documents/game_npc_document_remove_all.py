"""View for the restricted NPC document remove-all endpoint (dm/admin; accepts hidden)."""

from ...._character_shared import build_document_remove_all_view

game_npc_document_remove_all = build_document_remove_all_view(npc=True)
