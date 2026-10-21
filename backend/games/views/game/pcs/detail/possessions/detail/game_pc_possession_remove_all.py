"""View for the restricted PC possession remove-all endpoint (dm/admin/owner; accepts hidden)."""

from .......decorators import token_scopes
from ....._character.possessions._possession_shared import build_possession_remove_all_view

game_pc_possession_remove_all = token_scopes(POST=['pcs:write', 'possessions:read'])(
    build_possession_remove_all_view(npc=False),
)
