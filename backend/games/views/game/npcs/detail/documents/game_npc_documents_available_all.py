"""View for the DM-only NPC documents/available/all.json endpoint (includes hidden documents)."""

from ...._character_shared import build_documents_available_all_view

game_npc_documents_available_all = build_documents_available_all_view(npc=True)
