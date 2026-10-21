"""View for the NPC possession acquire endpoint."""

from .......decorators import token_scopes
from ....._character.possessions._possession_shared import build_possession_acquire_view

game_npc_possession_acquire = token_scopes(POST=['npcs:write'])(
    build_possession_acquire_view(npc=True),
)
