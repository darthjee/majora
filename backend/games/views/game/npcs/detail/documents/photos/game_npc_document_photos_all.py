"""View for the NPC document photos/all.json endpoint — DM/superuser only."""

from .......decorators import token_scopes
from ....._character.documents._document_shared import build_document_photos_all_view

game_npc_document_photos_all = token_scopes(GET=['npcs:read', 'documents:read'])(
    build_document_photos_all_view(npc=True),
)
