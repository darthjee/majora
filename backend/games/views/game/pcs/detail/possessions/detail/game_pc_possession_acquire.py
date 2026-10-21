"""View for the PC possession acquire endpoint."""

from .......decorators import token_scopes
from ....._character.possessions._possession_shared import build_possession_acquire_view

game_pc_possession_acquire = token_scopes(POST=['pcs:write'])(
    build_possession_acquire_view(npc=False),
)
