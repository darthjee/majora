"""View for the PC recipes/available/all.json endpoint (GameEdit; includes hidden)."""

from ......decorators import token_scopes
from ...._character.recipes._recipe_shared import build_recipes_available_all_view

game_pc_recipes_available_all = token_scopes(GET=['pcs:read', 'recipes:read'])(
    build_recipes_available_all_view(npc=False),
)
