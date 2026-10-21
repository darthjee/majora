"""View for the restricted PC faction remove-all endpoint (dm/admin/owner; accepts hidden)."""

from .......decorators import token_scopes
from ....._character.factions._faction_shared import build_faction_remove_all_view

game_pc_faction_remove_all = token_scopes(POST=['pcs:write', 'factions:read'])(
    build_faction_remove_all_view(npc=False),
)
