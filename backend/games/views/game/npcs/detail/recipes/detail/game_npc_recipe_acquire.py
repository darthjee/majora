"""View for the NPC recipe acquire endpoint (regular.create)."""

from .......decorators import token_scopes
from ....._character.recipes._recipe_shared import build_recipe_acquire_view

game_npc_recipe_acquire = token_scopes(POST=['npcs:write'])(build_recipe_acquire_view(npc=True))
