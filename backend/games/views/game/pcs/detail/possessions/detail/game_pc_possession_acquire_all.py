"""View for the DM-only PC possession acquire-all endpoint (accepts hidden game possessions)."""

from .......decorators import token_scopes
from ....._character.possessions._possession_shared import build_possession_acquire_all_view

game_pc_possession_acquire_all = token_scopes(POST=['pcs:write', 'possessions:read'])(
    build_possession_acquire_all_view(npc=False),
)
