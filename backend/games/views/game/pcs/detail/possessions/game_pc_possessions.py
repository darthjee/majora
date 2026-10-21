"""View for listing, or creating, a PC's possessions."""

from ......decorators import token_scopes
from ...._character.possessions._possession_shared import build_possessions_view

game_pc_possessions = token_scopes(GET=[], POST=['pcs:write', 'possessions:write'])(
    build_possessions_view(npc=False),
)
