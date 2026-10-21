"""View for the PC recipes/all.json endpoint (restricted; includes hidden)."""

from ......decorators import token_scopes
from ...._character.recipes._recipe_shared import build_recipes_all_view

game_pc_recipes_all = token_scopes(GET=['pcs:read', 'recipes:read'])(
    build_recipes_all_view(npc=False),
)
