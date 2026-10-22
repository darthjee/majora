"""View for the NPC possession remove endpoint."""

from .......decorators import token_scopes
from ....._character.possessions._possession_shared import build_possession_remove_view

game_npc_possession_remove = token_scopes(POST=['npcs:write'])(
    build_possession_remove_view(npc=True),
)
