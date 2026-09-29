"""View for the PC recipe remove/all.json endpoint (CharacterEdit)."""

from ....._character.recipes._recipe_shared import build_recipe_remove_all_view

game_pc_recipe_remove_all = build_recipe_remove_all_view(npc=False)
