"""View for the PC recipes/all.json endpoint (restricted; includes hidden)."""

from ...._character.recipes._recipe_shared import build_recipes_all_view

game_pc_recipes_all = build_recipes_all_view(npc=False)
