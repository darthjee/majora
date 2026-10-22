"""View for the restricted NPC faction remove-all endpoint (dm/admin/owner; accepts hidden)."""

from .......decorators import token_scopes
from ....._character.factions._faction_shared import build_faction_remove_all_view

game_npc_faction_remove_all = token_scopes(POST=['npcs:write', 'factions:read'])(
    build_faction_remove_all_view(npc=True),
)
