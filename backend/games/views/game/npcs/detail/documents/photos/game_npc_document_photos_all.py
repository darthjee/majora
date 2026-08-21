"""View for the NPC document photos/all.json endpoint — DM/superuser only."""

from ....._character.documents._document_shared import build_document_photos_all_view

game_npc_document_photos_all = build_document_photos_all_view(npc=True)
