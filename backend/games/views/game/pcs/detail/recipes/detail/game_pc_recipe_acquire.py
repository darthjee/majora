"""View for the PC recipe acquire endpoint (regular.create)."""

from .......decorators import token_scopes
from ....._character.recipes._recipe_shared import build_recipe_acquire_view

game_pc_recipe_acquire = token_scopes(POST=['pcs:write'])(build_recipe_acquire_view(npc=False))
