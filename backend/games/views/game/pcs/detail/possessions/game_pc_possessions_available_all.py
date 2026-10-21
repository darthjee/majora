"""View for the DM-only PC possessions/available/all.json endpoint (includes hidden)."""

from ......decorators import token_scopes
from ...._character.possessions._possession_shared import build_possessions_available_all_view

game_pc_possessions_available_all = token_scopes(GET=['pcs:read', 'possessions:read'])(
    build_possessions_available_all_view(npc=False),
)
