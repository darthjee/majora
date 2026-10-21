"""View for retrieving any recipe (including hidden) known by a PC (restricted)."""

from .......decorators import token_scopes
from ....._character.recipes._recipe_shared import build_recipe_detail_full_view

game_pc_recipe_detail_full = token_scopes(GET=['pcs:read', 'recipes:read'])(
    build_recipe_detail_full_view(npc=False),
)
