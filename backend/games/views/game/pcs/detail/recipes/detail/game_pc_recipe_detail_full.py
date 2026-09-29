"""View for retrieving any recipe (including hidden) known by a PC (restricted)."""

from ....._character.recipes._recipe_shared import build_recipe_detail_full_view

game_pc_recipe_detail_full = build_recipe_detail_full_view(npc=False)
