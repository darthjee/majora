"""View for the NPC recipe remove endpoint (regular.create)."""

from .......decorators import token_scopes
from ....._character.recipes._recipe_shared import build_recipe_remove_view

game_npc_recipe_remove = token_scopes(POST=['npcs:write'])(build_recipe_remove_view(npc=True))
