"""View for the PC recipe remove/all.json endpoint (CharacterEdit)."""

from .......decorators import token_scopes
from ....._character.recipes._recipe_shared import build_recipe_remove_all_view

game_pc_recipe_remove_all = token_scopes(POST=['pcs:write', 'recipes:read'])(
    build_recipe_remove_all_view(npc=False),
)
