"""View for the DM-only PC documents/available/all.json endpoint (includes hidden documents)."""

from ...._character_shared import build_documents_available_all_view

game_pc_documents_available_all = build_documents_available_all_view(npc=False)
