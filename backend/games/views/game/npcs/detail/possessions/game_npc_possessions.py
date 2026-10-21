"""View for listing, or creating, an NPC's possessions."""

from ......decorators import token_scopes
from ...._character.possessions._possession_shared import build_possessions_view

game_npc_possessions = token_scopes(GET=[], POST=['npcs:write', 'possessions:write'])(
    build_possessions_view(npc=True),
)
