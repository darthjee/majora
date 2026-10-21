"""View for listing the non-hidden recipes known by a PC."""

from ......decorators import token_scopes
from ...._character.recipes._recipe_shared import build_recipes_view

game_pc_recipes = token_scopes(GET=[])(build_recipes_view(npc=False))
