"""View for listing the ready photos of a document held by an NPC."""

from ....._character.documents._document_shared import build_document_photos_view

game_npc_document_photos = build_document_photos_view(npc=True)
