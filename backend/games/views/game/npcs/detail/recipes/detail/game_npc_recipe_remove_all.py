"""View for the NPC recipe remove/all.json endpoint (GameEdit)."""

from .......decorators import token_scopes
from ....._character.recipes._recipe_shared import build_recipe_remove_all_view

game_npc_recipe_remove_all = token_scopes(POST=['npcs:write', 'recipes:read'])(
    build_recipe_remove_all_view(npc=True),
)
