"""View for the PC recipe acquire endpoint (regular.create)."""

from ....._character.recipes._recipe_shared import build_recipe_acquire_view

game_pc_recipe_acquire = build_recipe_acquire_view(npc=False)
