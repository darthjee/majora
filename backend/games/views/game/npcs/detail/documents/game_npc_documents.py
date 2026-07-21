"""View for listing an NPC's documents."""

from ...._character_shared import build_documents_view

game_npc_documents = build_documents_view(npc=True)
