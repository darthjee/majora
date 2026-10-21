"""View for the PC recipes/available.json endpoint (regular.create)."""

from ......decorators import token_scopes
from ...._character.recipes._recipe_shared import build_recipes_available_view

game_pc_recipes_available = token_scopes(GET=[])(build_recipes_available_view(npc=False))
