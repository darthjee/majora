"""View for the DM-only NPC factions/available/all.json endpoint."""

from ......decorators import token_scopes
from ...._character.factions._faction_shared import build_factions_available_all_view

game_npc_factions_available_all = token_scopes(GET=['npcs:read', 'factions:read'])(
    build_factions_available_all_view(npc=True),
)
