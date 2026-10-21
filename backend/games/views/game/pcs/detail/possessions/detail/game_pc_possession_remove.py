"""View for the PC possession remove endpoint."""

from .......decorators import token_scopes
from ....._character.possessions._possession_shared import build_possession_remove_view

game_pc_possession_remove = token_scopes(POST=['pcs:write'])(
    build_possession_remove_view(npc=False),
)
