"""View for the PC document photos/all.json endpoint — dm, owner, or admin only."""

from ...._character_shared import build_document_photos_all_view

game_pc_document_photos_all = build_document_photos_all_view(npc=False)
