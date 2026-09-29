"""View for the PC recipes/available/all.json endpoint (GameEdit; includes hidden)."""

from ...._character.recipes._recipe_shared import build_recipes_available_all_view

game_pc_recipes_available_all = build_recipes_available_all_view(npc=False)
