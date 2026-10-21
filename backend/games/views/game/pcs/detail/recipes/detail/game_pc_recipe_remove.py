"""View for the PC recipe remove endpoint (regular.create)."""

from .......decorators import token_scopes
from ....._character.recipes._recipe_shared import build_recipe_remove_view

game_pc_recipe_remove = token_scopes(POST=['pcs:write'])(build_recipe_remove_view(npc=False))
