"""View for listing the non-hidden recipes known by a NPC."""

from ...._character.recipes._recipe_shared import build_recipes_view

game_npc_recipes = build_recipes_view(npc=True)
