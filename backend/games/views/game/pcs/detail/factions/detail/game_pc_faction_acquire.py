"""View for the PC faction acquire (enlist) endpoint."""

from .......decorators import token_scopes
from ....._character.factions._faction_shared import build_faction_acquire_view

game_pc_faction_acquire = token_scopes(POST=['pcs:write'])(build_faction_acquire_view(npc=False))
