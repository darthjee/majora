"""View for the DM-only PC factions/available/all.json endpoint."""

from ......decorators import token_scopes
from ...._character.factions._faction_shared import build_factions_available_all_view

game_pc_factions_available_all = token_scopes(GET=['pcs:read', 'factions:read'])(
    build_factions_available_all_view(npc=False),
)
