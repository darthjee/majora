"""View for the DM-only NPC faction acquire-all endpoint (bypasses hidden-character gate)."""

from .......decorators import token_scopes
from ....._character.factions._faction_shared import build_faction_acquire_all_view

game_npc_faction_acquire_all = token_scopes(POST=['npcs:write', 'factions:read'])(
    build_faction_acquire_all_view(npc=True),
)
