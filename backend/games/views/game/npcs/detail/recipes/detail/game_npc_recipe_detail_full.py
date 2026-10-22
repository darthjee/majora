"""View for retrieving any recipe (including hidden) known by a NPC (restricted)."""

from .......decorators import token_scopes
from ....._character.recipes._recipe_shared import build_recipe_detail_full_view

game_npc_recipe_detail_full = token_scopes(GET=['npcs:read', 'recipes:read'])(
    build_recipe_detail_full_view(npc=True),
)
