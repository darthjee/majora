"""View for the PC recipe acquire/all.json endpoint (GameEdit)."""

from .......decorators import token_scopes
from ....._character.recipes._recipe_shared import build_recipe_acquire_all_view

game_pc_recipe_acquire_all = token_scopes(POST=['pcs:write', 'recipes:read'])(
    build_recipe_acquire_all_view(npc=False),
)
