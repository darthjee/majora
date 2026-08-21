"""View for listing the ready photos of a document held by a PC."""

from ....._character.documents._document_shared import build_document_photos_view

game_pc_document_photos = build_document_photos_view(npc=False)
