"""View for retrieving a single recipe known by a NPC."""

from .......decorators import token_scopes
from ....._character.recipes._recipe_shared import build_recipe_detail_view

game_npc_recipe_detail = token_scopes(GET=[], PATCH=['npcs:write', 'recipes:read'])(
    build_recipe_detail_view(npc=True),
)
