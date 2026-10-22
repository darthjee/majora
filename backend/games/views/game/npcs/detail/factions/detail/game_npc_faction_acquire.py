"""View for the NPC faction acquire (enlist) endpoint."""

from .......decorators import token_scopes
from ....._character.factions._faction_shared import build_faction_acquire_view

game_npc_faction_acquire = token_scopes(POST=['npcs:write'])(build_faction_acquire_view(npc=True))
