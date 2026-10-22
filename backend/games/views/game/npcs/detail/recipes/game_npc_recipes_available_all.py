"""View for the NPC recipes/available/all.json endpoint (GameEdit; includes hidden)."""

from ......decorators import token_scopes
from ...._character.recipes._recipe_shared import build_recipes_available_all_view

game_npc_recipes_available_all = token_scopes(GET=['npcs:read', 'recipes:read'])(
    build_recipes_available_all_view(npc=True),
)
