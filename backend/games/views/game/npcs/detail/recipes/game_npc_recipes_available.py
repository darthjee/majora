"""View for the NPC recipes/available.json endpoint (regular.create)."""

from ......decorators import token_scopes
from ...._character.recipes._recipe_shared import build_recipes_available_view

game_npc_recipes_available = token_scopes(GET=['npcs:read', 'recipes:read'])(
    build_recipes_available_view(npc=True),
)
