"""View for listing a PC's documents."""

from ...._character_shared import build_documents_view

game_pc_documents = build_documents_view(npc=False)
