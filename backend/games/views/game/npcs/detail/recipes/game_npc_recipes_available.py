"""View for the NPC recipes/available.json endpoint (regular.create)."""

from ...._character.recipes._recipe_shared import build_recipes_available_view

game_npc_recipes_available = build_recipes_available_view(npc=True)
