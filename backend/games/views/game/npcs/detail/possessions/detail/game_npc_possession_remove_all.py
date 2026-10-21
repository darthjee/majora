"""View for the DM-only NPC possession remove-all endpoint (accepts hidden possessions)."""

from .......decorators import token_scopes
from ....._character.possessions._possession_shared import build_possession_remove_all_view

game_npc_possession_remove_all = token_scopes(POST=['npcs:write', 'possessions:read'])(
    build_possession_remove_all_view(npc=True),
)
