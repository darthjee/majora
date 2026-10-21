"""View for the DM-only NPC possession acquire-all endpoint (accepts hidden game possessions)."""

from .......decorators import token_scopes
from ....._character.possessions._possession_shared import build_possession_acquire_all_view

game_npc_possession_acquire_all = token_scopes(POST=['npcs:write', 'possessions:read'])(
    build_possession_acquire_all_view(npc=True),
)
