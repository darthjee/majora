"""View for retrieving a single recipe known by a PC."""

from ....._character.recipes._recipe_shared import build_recipe_detail_view

game_pc_recipe_detail = build_recipe_detail_view(npc=False)
